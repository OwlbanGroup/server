# Critical Path Test Script for Triton Inference Server Deployment Readiness (PowerShell)

Write-Host "Starting critical path tests for Triton Inference Server..."

# 1. Check if Triton server container is running (assuming Docker usage)
$containers = docker ps --format "{{.Names}}"
if (-not ($containers -contains "tritonserver")) {
    Write-Error "Error: Triton server container is not running."
    exit 1
}
Write-Host "Triton server container is running."

# 2. Check model repository accessibility (assuming local or S3 path)
$MODEL_REPO_PATH = "C:\models"
Write-Host "Checking model repository at $MODEL_REPO_PATH..."
if (-not (Test-Path $MODEL_REPO_PATH)) {
    Write-Error "Error: Model repository directory does not exist."
    exit 1
}
Write-Host "Model repository directory exists."

# 3. Send a basic inference request using Invoke-RestMethod to HTTP endpoint
$TRITON_SERVER_URL = "http://localhost:8000"
$MODEL_NAME = "densenet_onnx"
$INPUT_DATA_PATH = "mug.jpg"

Write-Host "Sending inference request to model $MODEL_NAME on $TRITON_SERVER_URL..."

# Download sample input image if not exists
if (-not (Test-Path $INPUT_DATA_PATH)) {
    Write-Host "Downloading sample input image..."
    Invoke-WebRequest -Uri "https://github.com/triton-inference-server/server/raw/main/docs/examples/images/mug.jpg" -OutFile $INPUT_DATA_PATH
}

# Prepare the request body (binary content)
$body = [System.IO.File]::ReadAllBytes($INPUT_DATA_PATH)

try {
    $response = Invoke-RestMethod -Uri "$TRITON_SERVER_URL/v2/models/$MODEL_NAME/infer" -Method Post -ContentType "application/octet-stream" -Body $body
    Write-Host "Inference request sent successfully."
} catch {
    Write-Error "Error sending inference request: $_"
    exit 1
}

# 4. Check server health endpoint
Write-Host "Checking server health endpoint..."
try {
    $health = Invoke-RestMethod -Uri "$TRITON_SERVER_URL/v2/health/ready" -Method Get
    if ($health -ne "READY") {
        Write-Error "Error: Server is not ready."
        exit 1
    }
    Write-Host "Server is ready."
} catch {
    Write-Error "Error checking server health: $_"
    exit 1
}

Write-Host "Critical path tests completed successfully."
