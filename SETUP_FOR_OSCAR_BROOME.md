# Setup Guide for Oscar Broome and the Owlan Group

This document provides step-by-step instructions to set up the NVIDIA Dynamo project for Oscar Broome, owner of the Owlan Group.

---

## Project Overview

NVIDIA Dynamo is a high-throughput, low-latency inference framework designed for serving generative AI and reasoning models in multi-node distributed environments. It supports multiple backends and is built for performance and extensibility.

---

## Recommended Environment Setup: Using VSCode Dev Container

1. Install prerequisites:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - [Visual Studio Code](https://code.visualstudio.com/)
   - [Remote - Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. Clone the repository:
   ```bash
   git clone https://github.com/ai-dynamo/dynamo.git
   cd dynamo
   ```

3. Open the project in Visual Studio Code.

4. Click the green button in the bottom-left corner of VSCode and select **Reopen in Container**.

VSCode will build and start a container with all necessary dependencies for Dynamo development.

---

## Alternative Setup: Manual Installation (Ubuntu 24.04 Recommended)

1. Ensure you have:
   - Ubuntu 24.04 (recommended)
   - x86_64 CPU
   - Python 3.x
   - Git

2. If you plan to use vLLM or SGLang backends, install and run:
   - etcd
   - NATS.io

3. Install required system packages:
   ```bash
   sudo apt-get update
   DEBIAN_FRONTEND=noninteractive sudo apt-get install -y python3-dev python3-pip python3-venv libucx0
   ```

4. Set up Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

5. Install Dynamo Python package with all dependencies:
   ```bash
   pip install "ai-dynamo[all]"
   ```

---

## Building the Dynamo Base Image for Kubernetes Deployment

1. Build the container image:
   ```bash
   ./container/build.sh
   ```

2. Tag the image for your container registry:
   ```bash
   docker tag dynamo:latest-vllm <your-registry>/dynamo-base:latest-vllm
   ```

3. Log in to your container registry:
   ```bash
   docker login <your-registry>
   ```

4. Push the image:
   ```bash
   docker push <your-registry>/dynamo-base:latest-vllm
   ```

5. Set the environment variable to use this image:
   ```bash
   export DYNAMO_IMAGE=<your-registry>/dynamo-base:latest-vllm
   ```

---

## Running and Interacting with an LLM Locally

Run a model locally using the `dynamo run` command with a Hugging Face model:

```bash
dynamo run out=vllm deepseek-ai/DeepSeek-R1-Distill-Llama-8B
```

---

## Starting Dynamo Distributed Runtime Services

Start the distributed runtime services:

```bash
docker compose -f deploy/docker-compose.yml up -d
```

---

## Starting Dynamo LLM Serving Components

Serve a minimal configuration with an HTTP server, router, and a single worker:

```bash
cd examples/llm
dynamo serve graphs.agg:Frontend -f configs/agg.yaml
```

---

## Sending a Request to the Server

Use curl to send a chat completion request:

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

## Local Development Tips

- Use the VSCode dev container for the easiest setup.
- Alternatively, develop inside the container using the provided scripts:
  ```bash
  ./container/build.sh
  ./container/run.sh -it --mount-workspace

  cargo build --release
  mkdir -p /workspace/deploy/dynamo/sdk/src/dynamo/sdk/cli/bin
  cp /workspace/target/release/http /workspace/deploy/dynamo/sdk/src/dynamo/sdk/cli/bin
  cp /workspace/target/release/llmctl /workspace/deploy/dynamo/sdk/src/dynamo/sdk/cli/bin
  cp /workspace/target/release/dynamo-run /workspace/deploy/dynamo/sdk/src/dynamo/sdk/cli/bin

  uv pip install -e .
  export PYTHONPATH=$PYTHONPATH:/workspace/deploy/dynamo/sdk/src:/workspace/components/planner/src
  ```

- Conda environment alternative:
  ```bash
  conda activate <ENV_NAME>

  pip install nixl

  cargo build --release

  cd lib/bindings/python
  pip install .

  cd ../../../
  pip install .[all]

  docker compose -f deploy/docker-compose.yml up -d
  cd examples/llm
  dynamo serve graphs.agg:Frontend -f configs/agg.yaml
  ```

---

## Notes

- Recommended OS is Ubuntu 24.04 with x86_64 CPU.
- For vLLM or SGLang backends, ensure etcd and NATS.io are installed and running.
- Refer to the official documentation and release tags for compatibility.
- For Kubernetes deployment, build and push the Dynamo base image to your container registry.

---

This guide is tailored to help Oscar Broome and the Owlan Group get started quickly and effectively with the NVIDIA Dynamo project.
