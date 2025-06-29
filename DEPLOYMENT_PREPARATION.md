# Deployment Preparation Instructions for NVIDIA Dynamo

This document provides step-by-step instructions to prepare the NVIDIA Dynamo project for deployment.

---

## 1. Build Release Binaries

Build the release binaries using Cargo:

```bash
cargo build --release
```

---

## 2. Copy Binaries to Deployment SDK Directory

Create the target directory and copy the built binaries:

```bash
mkdir -p deploy/sdk/src/dynamo/sdk/cli/bin
cp target/release/http deploy/sdk/src/dynamo/sdk/cli/bin/
cp target/release/llmctl deploy/sdk/src/dynamo/sdk/cli/bin/
cp target/release/dynamo-run deploy/sdk/src/dynamo/sdk/cli/bin/
```

---

## 3. Build the Docker Image

Build the Dynamo base Docker image using the provided build script:

```bash
./container/build.sh --framework vllm
```

- You can replace `vllm` with other supported frameworks such as `tensorrtllm`, `sglang`, or `none` as needed.
- For AWS environments, add the `--make-efa` flag to enable EFA support.

---

## 4. Tag and Push the Docker Image

Tag the image for your container registry and push it:

```bash
docker tag dynamo:latest-vllm <your-registry>/dynamo-base:latest-vllm
docker login <your-registry>
docker push <your-registry>/dynamo-base:latest-vllm
```

Set the environment variable to use this image:

```bash
export DYNAMO_IMAGE=<your-registry>/dynamo-base:latest-vllm
```

---

## 5. Start Prerequisite Services

Start the required distributed runtime services using Docker Compose:

```bash
docker compose -f deploy/metrics/docker-compose.yml up -d
```

This will start:

- NATS messaging server
- etcd key-value store
- Prometheus and Grafana for monitoring
- NVIDIA DCGM exporter for GPU metrics

---

## 6. Deploy Dynamo Services

You can deploy Dynamo services using one of the following methods:

### a. Using `dynamo serve` (for local or simple deployments)

Example:

```bash
cd examples/llm
dynamo serve graphs.agg:Frontend -f configs/agg.yaml
```

### b. Using Kubernetes Helm Charts (for production deployments)

Refer to the Helm charts in `deploy/helm/` and the manual Helm deployment guide:

- [Manual Helm Deployment Guide](docs/guides/dynamo_deploy/manual_helm_deployment.md)

### c. Using Dynamo Cloud Platform (managed deployment)

Refer to the Dynamo Cloud Platform guide:

- [Dynamo Cloud Platform Guide](docs/guides/dynamo_deploy/dynamo_cloud.md)

---

## 7. Set Environment Variables and PYTHONPATH

For local development or containerized environments, set the PYTHONPATH:

```bash
export PYTHONPATH=$PYTHONPATH:/workspace/deploy/sdk/src:/workspace/components/planner/src
```

Install Python packages in editable mode if needed:

```bash
pip install -e .
```

---

## 8. Testing the Deployment

Send a test request to the running Dynamo service:

```bash
curl localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ],
    "stream": false,
    "max_tokens": 300
  }' | jq
```

---

## Notes

- For development, consider using the VSCode dev container for an easy setup.
- For Kubernetes deployments, ensure you have built and pushed the Docker image to your container registry.
- Ensure prerequisite services (NATS, etcd, Prometheus, Grafana) are running before deploying Dynamo services.
- Refer to the official documentation and guides for advanced deployment scenarios and troubleshooting.

---

This completes the deployment preparation for the NVIDIA Dynamo project.
