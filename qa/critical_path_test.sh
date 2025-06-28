#!/bin/bash
# Critical Path Test Script for Triton Inference Server Deployment Readiness

set -e

echo "Starting critical path tests for Triton Inference Server..."

# 1. Check if Triton server container is running (assuming Docker usage)
if ! docker ps | grep -q tritonserver; then
  echo "Error: Triton server container is not running."
  exit 1
fi
echo "Triton server container is running."

# 2. Check model repository accessibility (assuming local or S3 path)
MODEL_REPO_PATH="/models"
echo "Checking model repository at $MODEL_REPO_PATH..."
if [ ! -d "$MODEL_REPO_PATH" ]; then
  echo "Error: Model repository directory does not exist."
  exit 1
fi
echo "Model repository directory exists."

# 3. Send a basic inference request using curl to HTTP endpoint
TRITON_SERVER_URL="localhost:8000"
MODEL_NAME="densenet_onnx"
INPUT_DATA="mug.jpg"
echo "Sending inference request to model $MODEL_NAME on $TRITON_SERVER_URL..."

# Prepare input data (assuming input image is available locally)
if [ ! -f "$INPUT_DATA" ]; then
  echo "Downloading sample input image..."
  curl -o $INPUT_DATA https://github.com/triton-inference-server/server/raw/main/docs/examples/images/mug.jpg
fi

# Send inference request using curl (simplified example)
curl -v -X POST http://$TRITON_SERVER_URL/v2/models/$MODEL_NAME/infer \
  -H "Content-Type: application/octet-stream" \
  --data-binary @$INPUT_DATA

echo "Inference request sent successfully."

# 4. Check server health endpoint
echo "Checking server health endpoint..."
curl -s http://$TRITON_SERVER_URL/v2/health/ready | grep -q "READY"
if [ $? -ne 0 ]; then
  echo "Error: Server is not ready."
  exit 1
fi
echo "Server is ready."

echo "Critical path tests completed successfully."
