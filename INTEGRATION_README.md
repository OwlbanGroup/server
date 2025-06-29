# Integration of OwlbanGroup Platform into Triton Inference Server Project

## Overview

This document describes the integration of the OwlbanGroup Node.js web platform into the NVIDIA Triton Inference Server project as a separate service.

## Integration Details

- OwlbanGroup platform is cloned into the `external/owlbangroup.io` directory.
- A new `docker-compose.yml` file is added at the project root to orchestrate both Triton and OwlbanGroup services.
- Deployment scripts `deploy.sh` (Linux/macOS) and `deploy.ps1` (Windows PowerShell) are added to build and run the integrated services.
- OwlbanGroup service runs on ports 3000 (backend) and 8080 (frontend).
- Triton service runs with GPU support and exposes ports 8000, 8001, and 8002.

## Running the Integrated System

### Prerequisites

- Docker and Docker Compose installed
- NVIDIA GPU drivers and Docker runtime configured for Triton

### Start Services

Run the deployment script for your platform:

- Linux/macOS:

```bash
./deploy.sh
```

- Windows PowerShell:

```powershell
.\deploy.ps1
```

### Stop Services

```bash
docker-compose down
```

## Notes

- Ensure environment variables for both services are configured as needed.
- Modify `docker-compose.yml` to customize service configurations.
- This integration allows running both services side-by-side for development and testing.

## Further Integration

- For production deployment, consider adapting Kubernetes manifests or cloud deployment scripts.
- Implement inter-service communication if needed via APIs or messaging.
