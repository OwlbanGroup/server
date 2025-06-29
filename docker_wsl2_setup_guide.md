# Step-by-Step Guide to Configure Docker Desktop with WSL 2 Backend on Windows

This guide will help you configure Docker Desktop to use the WSL 2 backend on Windows, enabling better integration and performance.

---

## Step 1: Verify WSL 2 Installation

1. Open PowerShell as Administrator.
2. Run the command:

   ```bash
   wsl --list --verbose
   ```

3. Ensure your Linux distributions are using version 2. If not, set the default version to 2:

   ```bash
   wsl --set-default-version 2
   ```

4. If WSL is not installed, follow Microsoft’s guide to install WSL 2:  
   [https://docs.microsoft.com/en-us/windows/wsl/install-win10](https://docs.microsoft.com/en-us/windows/wsl/install-win10)

---

## Step 2: Enable WSL 2 Integration in Docker Desktop

1. Open Docker Desktop.
2. Click on the gear icon (Settings).
3. Navigate to **General**.
4. Ensure **Use the WSL 2 based engine** is checked.
5. Navigate to **Resources > WSL Integration**.
6. Enable integration with your installed Linux distributions by toggling them on.
7. Click **Apply & Restart**.

---

## Step 3: Verify Docker Daemon is Running

1. Open a new PowerShell or Command Prompt window.
2. Run:

   ```bash
   docker version
   ```

3. Confirm that both Client and Server sections show version information without errors.

---

## Step 4: Run Triton Inference Server Container

1. Run the following command to start the Triton server container:

   ```bash
   docker run --gpus=all --rm -d --name tritonserver -p 8000:8000 -p 8001:8001 -p 8002:8002 nvcr.io/nvidia/tritonserver:22.12-py3
   ```

2. Verify the container is running:

   ```bash
   docker ps
   ```

---

## Step 5: Run Critical Path Test Script

1. Run the PowerShell critical path test script:

   ```powershell
   powershell -ExecutionPolicy Bypass -File qa/critical_path_test.ps1
   ```

2. Confirm all tests pass successfully.

---

If you encounter any issues during these steps, please let me know, and I will assist you further.
