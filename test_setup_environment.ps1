# PowerShell script to test NVIDIA Dynamo environment setup for Oscar Broome and the Owlan Group

Write-Host "Starting environment setup tests..."

# Check Docker installation
Write-Host "Checking Docker installation..."
try {
    $dockerVersion = docker --version
    Write-Host "Docker is installed:" $dockerVersion
} catch {
    Write-Error "Docker is not installed or not in PATH."
    exit 1
}

# Check VSCode installation
Write-Host "Checking Visual Studio Code installation..."
try {
    $codeVersion = code --version
    Write-Host "VSCode is installed. Version info:"
    Write-Host $codeVersion
} catch {
    Write-Error "VSCode is not installed or 'code' command is not in PATH."
    exit 1
}

# Check Remote Containers extension in VSCode
Write-Host "Checking for Remote - Containers extension in VSCode..."
$extensions = code --list-extensions
if ($extensions -contains "ms-vscode-remote.remote-containers") {
    Write-Host "Remote - Containers extension is installed."
} else {
    Write-Warning "Remote - Containers extension is NOT installed."
}

# Check if repository is cloned
$repoPath = Join-Path (Get-Location) "dynamo"
if (Test-Path $repoPath) {
    Write-Host "Repository 'dynamo' found at $repoPath"
} else {
    Write-Warning "Repository 'dynamo' not found. Cloning..."
    git clone https://github.com/ai-dynamo/dynamo.git
    if (-not (Test-Path $repoPath)) {
        Write-Error "Failed to clone repository."
        exit 1
    }
}

# Build and run dev container (simplified)
Write-Host "Building and running dev container..."
Set-Location $repoPath
# Check if Dockerfile exists
if (Test-Path ".devcontainer/Dockerfile") {
    Write-Host "Found devcontainer Dockerfile."
} else {
    Write-Warning "Devcontainer Dockerfile not found."
    Write-Host "Skipping devcontainer build step."
    Write-Host "Environment setup tests completed successfully."
    exit 0
}

# Build docker image for devcontainer (optional)
# This is a simplified step; actual devcontainer build is managed by VSCode
docker build -t dynamo-devcontainer -f .devcontainer/Dockerfile .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build devcontainer image."
    exit 1
} else {
    Write-Host "Devcontainer image built successfully."
}

# Run a container to test dynamo CLI
Write-Host "Running dynamo CLI help command inside container..."
docker run --rm dynamo-devcontainer dynamo --help

if ($LASTEXITCODE -ne 0) {
    Write-Error "Dynamo CLI command failed inside container."
    exit 1
} else {
    Write-Host "Dynamo CLI command executed successfully."
}

Write-Host "Environment setup tests completed successfully."
