# Docker Desktop Installation and Setup on Windows

Follow these steps to install and set up Docker Desktop on your Windows 10 system:

## Step 1: Download Docker Desktop Installer
- Go to the official Docker website: https://www.docker.com/products/docker-desktop
- Click on "Download for Windows (Windows 10 64-bit)" to download the installer.

## Step 2: Run the Installer
- Locate the downloaded `Docker Desktop Installer.exe` file and double-click it to run.
- If prompted by User Account Control, click "Yes" to allow the installer to make changes.

## Step 3: Installation Wizard
- Follow the installation wizard steps:
  - Accept the license agreement.
  - Choose to enable "Use WSL 2 instead of Hyper-V" if available (recommended).
  - Click "Install" to begin the installation.

## Step 4: Complete Installation
- Wait for the installation to complete.
- When prompted, restart your computer to finalize the installation.

## Step 5: Launch Docker Desktop
- After reboot, launch Docker Desktop from the Start menu.
- Docker will initialize and may ask for permissions; allow them.
- You should see the Docker whale icon in the system tray indicating Docker is running.

## Step 6: Verify Installation
- Open PowerShell or Command Prompt.
- Run the command:
  ```
  docker version
  ```
- You should see client and server version information confirming Docker is installed and running.

## Step 7: Enable WSL 2 (if not already enabled)
- Docker Desktop requires WSL 2 backend for best performance.
- Follow Microsoft’s guide to install and enable WSL 2:
  https://docs.microsoft.com/en-us/windows/wsl/install-win10

## Step 8: Run Triton Inference Server Container
- Once Docker is running, you can run the Triton container:
  ```
  docker run --gpus=all --rm -d --name tritonserver -p 8000:8000 -p 8001:8001 -p 8002:8002 nvcr.io/nvidia/tritonserver:22.12-py3
  ```

## Additional Resources
- Docker Desktop documentation: https://docs.docker.com/desktop/windows/install/
- Troubleshooting Docker Desktop: https://docs.docker.com/docker-for-windows/troubleshoot/

---

If you want, I can guide you through each step interactively.
