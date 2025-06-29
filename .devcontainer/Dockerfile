# Use an official Ubuntu base image
FROM ubuntu:24.04

# Set environment variables to avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
    python3-venv \
    libucx0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (required for building Dynamo)
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Set working directory
WORKDIR /workspace

# Default command
CMD [ "bash" ]
