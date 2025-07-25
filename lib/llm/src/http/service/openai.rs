// SPDX-FileCopyrightText: Copyright (c) 2024-2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

use axum::{
    extract::State,
    http::StatusCode,
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse, Response,
    },
    routing::{get, post},
    Json, Router,
};
use futures::{Stream, StreamExt};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    pin::Pin,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};
use tokio_stream::wrappers::ReceiverStream;

use super::{
    error::HttpError,
    metrics::{Endpoint, InflightGuard, ResponseMetricCollector},
    service_v2, RouteDoc,
};

use crate::preprocessor::LLMMetricAnnotation;
use crate::protocols::openai::embeddings::{NvCreateEmbeddingRequest, NvCreateEmbeddingResponse};
use crate::protocols::openai::{
    chat_completions::NvCreateChatCompletionResponse, completions::NvCreateCompletionResponse,
};
use crate::request_template::RequestTemplate;
use crate::types::{
    openai::{
        chat_completions::NvCreateChatCompletionRequest, completions::NvCreateCompletionRequest,
    },
    Annotated,
};

use dynamo_runtime::pipeline::{AsyncEngineContext, Context};

#[derive(Serialize, Deserialize)]
pub(crate) struct ErrorResponse {
    error: String,
}

impl ErrorResponse {
    /// Not Found Error
    pub fn model_not_found() -> (StatusCode, Json<ErrorResponse>) {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Model not found".to_string(),
            }),
        )
    }

    /// Service Unavailable
    /// This is returned when the service is live, but not ready.
    pub fn _service_unavailable() -> (StatusCode, Json<ErrorResponse>) {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "Service is not ready".to_string(),
            }),
        )
    }

    /// Internal Service Error
    /// Return this error when the service encounters an internal error.
    /// We should return a generic message to the client instead of the real error.
    /// Internal Services errors are the result of misconfiguration or bugs in the service.
    pub fn internal_server_error(msg: &str) -> (StatusCode, Json<ErrorResponse>) {
        tracing::error!("Internal server error: {msg}");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: msg.to_string(),
            }),
        )
    }

    /// The OAI endpoints call an [`dynamo.runtime::engine::AsyncEngine`] which are specialized to return
    /// an [`anyhow::Error`]. This method will convert the [`anyhow::Error`] into an [`HttpError`].
    /// If successful, it will return the [`HttpError`] as an [`ErrorResponse::internal_server_error`]
    /// with the details of the error.
    pub fn from_anyhow(err: anyhow::Error, alt_msg: &str) -> (StatusCode, Json<ErrorResponse>) {
        match err.downcast::<HttpError>() {
            Ok(http_error) => ErrorResponse::from_http_error(http_error),
            Err(err) => ErrorResponse::internal_server_error(&format!("{alt_msg}: {err}")),
        }
    }

    /// Implementers should only be able to throw 400-499 errors.
    pub fn from_http_error(err: HttpError) -> (StatusCode, Json<ErrorResponse>) {
        if err.code < 400 || err.code >= 500 {
            return ErrorResponse::internal_server_error(&err.message);
        }
        match StatusCode::from_u16(err.code) {
            Ok(code) => (code, Json(ErrorResponse { error: err.message })),
            Err(_) => ErrorResponse::internal_server_error(&err.message),
        }
    }
}

impl From<HttpError> for ErrorResponse {
    fn from(err: HttpError) -> Self {
        ErrorResponse { error: err.message }
    }
}

/// OpenAI Completions Request Handler
///
/// This method will handle the incoming request for the `/v1/completions endpoint`. The endpoint is a "source"
/// for an [`super::OpenAICompletionsStreamingEngine`] and will return a stream of
/// responses which will be forward to the client.
///
/// Note: For all requests, streaming or non-streaming, we always call the engine with streaming enabled. For
/// non-streaming requests, we will fold the stream into a single response as part of this handler.
#[tracing::instrument(skip_all)]
async fn completions(
    State(state): State<Arc<service_v2::State>>,
    Json(request): Json<NvCreateCompletionRequest>,
) -> Result<Response, (StatusCode, Json<ErrorResponse>)> {
    // return a 503 if the service is not ready
    check_ready(&state)?;

    // todo - extract distributed tracing id and context id from headers
    let request_id = uuid::Uuid::new_v4().to_string();

    // todo - decide on default
    let streaming = request.inner.stream.unwrap_or(false);

    // update the request to always stream
    let inner = async_openai::types::CreateCompletionRequest {
        stream: Some(true),
        ..request.inner
    };

    let request = NvCreateCompletionRequest {
        inner,
        nvext: request.nvext,
    };

    // todo - make the protocols be optional for model name
    // todo - when optional, if none, apply a default
    let model = &request.inner.model;

    // todo - error handling should be more robust
    let engine = state
        .manager()
        .get_completions_engine(model)
        .map_err(|_| ErrorResponse::model_not_found())?;

    let mut inflight_guard =
        state
            .metrics_clone()
            .create_inflight_guard(model, Endpoint::Completions, streaming);

    let mut response_collector = state.metrics_clone().create_response_collector(model);

    // setup context
    // todo - inherit request_id from distributed trace details
    let request = Context::with_id(request, request_id.clone());

    // issue the generate call on the engine
    let stream = engine
        .generate(request)
        .await
        .map_err(|e| ErrorResponse::from_anyhow(e, "Failed to generate completions"))?;

    // capture the context to cancel the stream if the client disconnects
    let ctx = stream.context();

    // todo - tap the stream and propagate request level metrics
    // note - we might do this as part of the post processing set to make it more generic

    if streaming {
        let stream = stream.map(move |response| {
            process_event_converter(EventConverter::from(response), &mut response_collector)
        });
        let stream = monitor_for_disconnects(stream.boxed(), ctx, inflight_guard).await;

        let mut sse_stream = Sse::new(stream);

        if let Some(keep_alive) = state.sse_keep_alive() {
            sse_stream = sse_stream.keep_alive(KeepAlive::default().interval(keep_alive));
        }

        Ok(sse_stream.into_response())
    } else {
        // TODO: report ISL/OSL for non-streaming requests
        let response = NvCreateCompletionResponse::from_annotated_stream(stream.into())
            .await
            .map_err(|e| {
                tracing::error!(
                    "Failed to fold completions stream for {}: {:?}",
                    request_id,
                    e
                );
                ErrorResponse::internal_server_error("Failed to fold completions stream")
            })?;

        inflight_guard.mark_ok();
        Ok(Json(response).into_response())
    }
}

#[tracing::instrument(skip_all)]
async fn embeddings(
    State(state): State<Arc<service_v2::State>>,
    Json(request): Json<NvCreateEmbeddingRequest>,
) -> Result<Response, (StatusCode, Json<ErrorResponse>)> {
    // return a 503 if the service is not ready
    check_ready(&state)?;

    // todo - extract distributed tracing id and context id from headers
    let request_id = uuid::Uuid::new_v4().to_string();

    // Embeddings are typically not streamed, so we default to non-streaming
    let streaming = false;

    // todo - make the protocols be optional for model name
    // todo - when optional, if none, apply a default
    let model = &request.inner.model;

    // todo - error handling should be more robust
    let engine = state
        .manager()
        .get_embeddings_engine(model)
        .map_err(|_| ErrorResponse::model_not_found())?;

    // this will increment the inflight gauge for the model
    let mut inflight =
        state
            .metrics_clone()
            .create_inflight_guard(model, Endpoint::Embeddings, streaming);

    // setup context
    // todo - inherit request_id from distributed trace details
    let request = Context::with_id(request, request_id.clone());

    // issue the generate call on the engine
    let stream = engine
        .generate(request)
        .await
        .map_err(|e| ErrorResponse::from_anyhow(e, "Failed to generate embeddings"))?;

    // Embeddings are typically returned as a single response (non-streaming)
    // so we fold the stream into a single response
    let response = NvCreateEmbeddingResponse::from_annotated_stream(stream.into())
        .await
        .map_err(|e| {
            tracing::error!(
                "Failed to fold embeddings stream for {}: {:?}",
                request_id,
                e
            );
            ErrorResponse::internal_server_error("Failed to fold embeddings stream")
        })?;

    inflight.mark_ok();
    Ok(Json(response).into_response())
}

/// OpenAI Chat Completions Request Handler
///
/// This method will handle the incoming request for the /v1/chat/completions endpoint. The endpoint is a "source"
/// for an [`super::OpenAIChatCompletionsStreamingEngine`] and will return a stream of responses which will be
/// forward to the client.
///
/// Note: For all requests, streaming or non-streaming, we always call the engine with streaming enabled. For
/// non-streaming requests, we will fold the stream into a single response as part of this handler.
#[tracing::instrument(skip_all)]
async fn chat_completions(
    State((state, template)): State<(Arc<service_v2::State>, Option<RequestTemplate>)>,
    Json(mut request): Json<NvCreateChatCompletionRequest>,
) -> Result<Response, (StatusCode, Json<ErrorResponse>)> {
    // return a 503 if the service is not ready
    check_ready(&state)?;

    // Apply template values if present
    if let Some(template) = template {
        if request.inner.model.is_empty() {
            request.inner.model = template.model.clone();
        }
        if request.inner.temperature.unwrap_or(0.0) == 0.0 {
            request.inner.temperature = Some(template.temperature);
        }
        if request.inner.max_completion_tokens.unwrap_or(0) == 0 {
            request.inner.max_completion_tokens = Some(template.max_completion_tokens);
        }
    }
    tracing::trace!("Received chat completions request: {:?}", request.inner);

    // todo - extract distributed tracing id and context id from headers
    let request_id = uuid::Uuid::new_v4().to_string();

    // todo - decide on default
    let streaming = request.inner.stream.unwrap_or(false);

    // update the request to always stream
    let inner_request = async_openai::types::CreateChatCompletionRequest {
        stream: Some(true),
        ..request.inner
    };

    let request = NvCreateChatCompletionRequest {
        inner: inner_request,
        nvext: request.nvext,
    };

    // todo - make the protocols be optional for model name
    // todo - when optional, if none, apply a default
    let model = &request.inner.model;

    // todo - determine the proper error code for when a request model is not present
    tracing::trace!("Getting chat completions engine for model: {}", model);

    let engine = state
        .manager()
        .get_chat_completions_engine(model)
        .map_err(|_| ErrorResponse::model_not_found())?;

    let mut inflight_guard =
        state
            .metrics_clone()
            .create_inflight_guard(model, Endpoint::ChatCompletions, streaming);

    let mut response_collector = state.metrics_clone().create_response_collector(model);

    // setup context
    // todo - inherit request_id from distributed trace details
    let request = Context::with_id(request, request_id.clone());

    tracing::trace!("Issuing generate call for chat completions");

    // issue the generate call on the engine
    let stream = engine
        .generate(request)
        .await
        .map_err(|e| ErrorResponse::from_anyhow(e, "Failed to generate completions"))?;

    // capture the context to cancel the stream if the client disconnects
    let ctx = stream.context();

    // todo - tap the stream and propagate request level metrics
    // note - we might do this as part of the post processing set to make it more generic

    if streaming {
        let stream = stream.map(move |response| {
            process_event_converter(EventConverter::from(response), &mut response_collector)
        });
        let stream = monitor_for_disconnects(stream.boxed(), ctx, inflight_guard).await;

        let mut sse_stream = Sse::new(stream);

        if let Some(keep_alive) = state.sse_keep_alive() {
            sse_stream = sse_stream.keep_alive(KeepAlive::default().interval(keep_alive));
        }

        Ok(sse_stream.into_response())
    } else {
        // TODO: report ISL/OSL for non-streaming requests
        let response = NvCreateChatCompletionResponse::from_annotated_stream(stream.into())
            .await
            .map_err(|e| {
                tracing::error!(
                    request_id,
                    "Failed to fold chat completions stream for: {:?}",
                    e
                );
                ErrorResponse::internal_server_error(&format!(
                    "Failed to fold chat completions stream: {}",
                    e
                ))
            })?;

        inflight_guard.mark_ok();
        Ok(Json(response).into_response())
    }
}

// todo - abstract this to the top level lib.rs to be reused
// todo - move the service_observer to its own state/arc
fn check_ready(_state: &Arc<service_v2::State>) -> Result<(), (StatusCode, Json<ErrorResponse>)> {
    // if state.service_observer.stage() != ServiceStage::Ready {
    //     return Err(ErrorResponse::service_unavailable());
    // }
    Ok(())
}

/// openai compatible format
/// Example:
/// {
///  "object": "list",
///  "data": [
///    {
///      "id": "model-id-0",
///      "object": "model",
///      "created": 1686935002,
///      "owned_by": "organization-owner"
///    },
///    ]
/// }
async fn list_models_openai(
    State(state): State<Arc<service_v2::State>>,
) -> Result<Response, (StatusCode, Json<ErrorResponse>)> {
    check_ready(&state)?;

    let created = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let mut data = Vec::new();

    let models: HashSet<String> = state.manager().model_display_names();
    for model_name in models {
        data.push(ModelListing {
            id: model_name.clone(),
            object: "object",
            created,                        // Where would this come from? The GGUF?
            owned_by: "nvidia".to_string(), // Get organization from GGUF
        });
    }

    let out = ListModelOpenAI {
        object: "list",
        data,
    };
    Ok(Json(out).into_response())
}

#[derive(Serialize)]
struct ListModelOpenAI {
    object: &'static str, // always "list"
    data: Vec<ModelListing>,
}

#[derive(Serialize)]
struct ModelListing {
    id: String,
    object: &'static str, // always "object"
    created: u64,         //  Seconds since epoch
    owned_by: String,
}

/// This method will consume a stream of SSE events and forward them to a new stream defined by a tokio channel.
/// In this way, if the downstream is dropped, then the upstream will be unable to send any more events. This is
/// how we can monitor for disconnects and stop the generation of completions.
///
/// If a disconnect is detected, then the context will issue a `stop_generating` call to the context which will
/// propagate the cancellation signal to the backend.
async fn monitor_for_disconnects(
    stream: Pin<
        Box<dyn Stream<Item = Result<axum::response::sse::Event, axum::Error>> + std::marker::Send>,
    >,
    context: Arc<dyn AsyncEngineContext>,
    mut inflight_guard: InflightGuard,
) -> ReceiverStream<Result<Event, axum::Error>> {
    let (tx, rx) = tokio::sync::mpsc::channel(8);

    tokio::spawn(async move {
        let mut stream = stream;
        while let Some(event) = stream.next().await {
            let event = match event {
                Ok(event) => Ok(event),
                Err(err) => Ok(Event::default().event("error").comment(err.to_string())),
            };

            if (tx.send(event).await).is_err() {
                tracing::trace!("Forwarding SSE stream was dropped; breaking loop");
                context.stop_generating();
                break;
            }
        }

        // Stream completed successfully - mark as ok
        if tx.send(Ok(Event::default().data("[DONE]"))).await.is_ok() {
            inflight_guard.mark_ok();
        }
    });

    ReceiverStream::new(rx)
}

struct EventConverter<T>(Annotated<T>);

impl<T> From<Annotated<T>> for EventConverter<T> {
    fn from(annotated: Annotated<T>) -> Self {
        EventConverter(annotated)
    }
}

fn process_event_converter<T: Serialize>(
    annotated: EventConverter<T>,
    response_collector: &mut ResponseMetricCollector,
) -> Result<Event, axum::Error> {
    let mut annotated = annotated.0;

    // update metrics
    if let Ok(Some(metrics)) = LLMMetricAnnotation::from_annotation(&annotated) {
        response_collector.observe_current_osl(metrics.output_tokens);
        response_collector.observe_response(metrics.input_tokens, metrics.chunk_tokens);

        // Chomp the LLMMetricAnnotation so it's not returned in the response stream
        // TODO: add a flag to control what is returned in the SSE stream
        if annotated.event.as_deref() == Some(crate::preprocessor::ANNOTATION_LLM_METRICS) {
            annotated.event = None;
            annotated.comment = None;
        }
    }

    let mut event = Event::default();

    if let Some(data) = annotated.data {
        event = event.json_data(data)?;
    }

    if let Some(msg) = annotated.event {
        if msg == "error" {
            let msgs = annotated
                .comment
                .unwrap_or_else(|| vec!["unspecified error".to_string()]);
            return Err(axum::Error::new(msgs.join(" -- ")));
        }
        event = event.event(msg);
    }

    if let Some(comments) = annotated.comment {
        for comment in comments {
            event = event.comment(comment);
        }
    }

    Ok(event)
}

/// Create an Axum [`Router`] for the OpenAI API Completions endpoint
/// If not path is provided, the default path is `/v1/completions`
pub fn completions_router(
    state: Arc<service_v2::State>,
    path: Option<String>,
) -> (Vec<RouteDoc>, Router) {
    let path = path.unwrap_or("/v1/completions".to_string());
    let doc = RouteDoc::new(axum::http::Method::POST, &path);
    let router = Router::new()
        .route(&path, post(completions))
        .with_state(state);
    (vec![doc], router)
}

/// Create an Axum [`Router`] for the OpenAI API Chat Completions endpoint
/// If not path is provided, the default path is `/v1/chat/completions`
pub fn chat_completions_router(
    state: Arc<service_v2::State>,
    template: Option<RequestTemplate>,
    path: Option<String>,
) -> (Vec<RouteDoc>, Router) {
    let path = path.unwrap_or("/v1/chat/completions".to_string());
    let doc = RouteDoc::new(axum::http::Method::POST, &path);
    let router = Router::new()
        .route(&path, post(chat_completions))
        .with_state((state, template));
    (vec![doc], router)
}

/// Create an Axum [`Router`] for the OpenAI API Embeddings endpoint
/// If not path is provided, the default path is `/v1/embeddings`
pub fn embeddings_router(
    state: Arc<service_v2::State>,
    path: Option<String>,
) -> (Vec<RouteDoc>, Router) {
    let path = path.unwrap_or("/v1/embeddings".to_string());
    let doc = RouteDoc::new(axum::http::Method::POST, &path);
    let router = Router::new()
        .route(&path, post(embeddings))
        .with_state(state);
    (vec![doc], router)
}

/// List Models
pub fn list_models_router(
    state: Arc<service_v2::State>,
    path: Option<String>,
) -> (Vec<RouteDoc>, Router) {
    // Standard OpenAI compatible list models endpoint
    let openai_path = path.unwrap_or("/v1/models".to_string());
    let doc_for_openai = RouteDoc::new(axum::http::Method::GET, &openai_path);

    let router = Router::new()
        .route(&openai_path, get(list_models_openai))
        .with_state(state);

    (vec![doc_for_openai], router)
}

#[cfg(test)]
mod tests {
    use crate::discovery::ModelManagerError;

    use super::*;

    const BACKUP_ERROR_MESSAGE: &str = "Failed to generate completions";

    fn http_error_from_engine(code: u16) -> Result<(), anyhow::Error> {
        Err(HttpError {
            code,
            message: "custom error message".to_string(),
        })?
    }

    fn other_error_from_engine() -> Result<(), anyhow::Error> {
        Err(ModelManagerError::ModelNotFound("foo".to_string()))?
    }

    #[test]
    fn test_http_error_response_from_anyhow() {
        let err = http_error_from_engine(400).unwrap_err();
        let (status, response) = ErrorResponse::from_anyhow(err, BACKUP_ERROR_MESSAGE);
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(response.error, "custom error message");
    }

    #[test]
    fn test_error_response_from_anyhow_out_of_range() {
        let err = http_error_from_engine(399).unwrap_err();
        let (status, response) = ErrorResponse::from_anyhow(err, BACKUP_ERROR_MESSAGE);
        assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(response.error, "custom error message");

        let err = http_error_from_engine(500).unwrap_err();
        let (status, response) = ErrorResponse::from_anyhow(err, BACKUP_ERROR_MESSAGE);
        assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(response.error, "custom error message");

        let err = http_error_from_engine(501).unwrap_err();
        let (status, response) = ErrorResponse::from_anyhow(err, BACKUP_ERROR_MESSAGE);
        assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(response.error, "custom error message");
    }

    #[test]
    fn test_other_error_response_from_anyhow() {
        let err = other_error_from_engine().unwrap_err();
        let (status, response) = ErrorResponse::from_anyhow(err, BACKUP_ERROR_MESSAGE);
        assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(
            response.error,
            format!(
                "{}: {}",
                BACKUP_ERROR_MESSAGE,
                other_error_from_engine().unwrap_err()
            )
        );
    }
}
