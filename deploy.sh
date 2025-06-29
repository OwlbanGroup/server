#!/bin/bash
# Deployment script for Linux/macOS to build and run the integrated docker-compose setup

echo "Building and starting services with docker-compose..."
docker-compose build
docker-compose up -d

echo "Deployment complete. Services are running."
