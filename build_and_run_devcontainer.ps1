# PowerShell script to build and run the NVIDIA Dynamo dev container manually

# Set the project directory path
$projectPath = "C:\\Users\\David L\\OneDrive\\Documents\\GitHub\\Organizational-Leadership-Telehealth\\dynamo"

# Change to project directory
Set-Location $projectPath

# Build the devcontainer Docker image
Write-Host "Building the devcontainer Docker image..."
docker build -t dynamo-devcontainer -f .devcontainer/Dockerfile .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build the devcontainer image."
    exit 1
} else {
    Write-Host "Devcontainer image built successfully."
}

# Run the devcontainer interactively with workspace mounted
Write-Host "Running the devcontainer interactively..."
docker run -it --rm -v ${PWD}:/workspace -w /workspace dynamo-devcontainer bash

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to run the devcontainer."
    exit 1
} else {
    Write-Host "Devcontainer ran successfully."
}
