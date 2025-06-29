# Deployment script for Windows PowerShell to build and run the integrated docker-compose setup

Write-Host "Building and starting services with docker-compose..."
docker-compose build
docker-compose up -d

Write-Host "Deployment complete. Services are running."
