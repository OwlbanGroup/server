# Full Environment Setup Guide for Oscar Broome and the Owlan Group

This guide provides detailed step-by-step instructions to set up the development environment for the NVIDIA Dynamo project from scratch.

---

## 1. Install Docker Desktop

Docker Desktop is required to run the VSCode dev container.

- Download Docker Desktop for Windows from: https://www.docker.com/products/docker-desktop
- Run the installer and follow the prompts.
- After installation, launch Docker Desktop and ensure it is running.
- Verify installation by opening a command prompt and running:
  ```
  docker --version
  ```

---

## 2. Install Visual Studio Code

Visual Studio Code (VSCode) is the recommended IDE for development.

- Download VSCode for Windows from: https://code.visualstudio.com/
- Run the installer and follow the prompts.
- Launch VSCode after installation.

---

## 3. Install Remote Containers Extension in VSCode

This extension allows VSCode to work with development containers.

- Open VSCode.
- Go to the Extensions view by clicking the square icon on the sidebar or pressing `Ctrl+Shift+X`.
- Search for "Remote - Containers".
- Click **Install** on the extension published by Microsoft.

---

## 4. Clone the NVIDIA Dynamo Repository

- Open a command prompt or PowerShell.
- Navigate to the directory where you want to clone the repo.
- Run:
  ```
  git clone https://github.com/ai-dynamo/dynamo.git
  cd dynamo
  ```

---

## 5. Open the Project in VSCode

- Launch VSCode.
- Click **File > Open Folder...** and select the cloned `dynamo` folder.
- Alternatively, from the command line inside the `dynamo` folder, run:
  ```
  code .
  ```

---

## 6. Reopen the Project in the Dev Container

- In VSCode, click the green button in the bottom-left corner.
- Select **Reopen in Container**.
- VSCode will build the development container image and start the container.
- This may take some time on the first run.
- Once complete, you will be inside the container with all dependencies installed.

---

## Verification

- After the container starts, open a terminal in VSCode.
- Run:
  ```
  dynamo --help
  ```
- You should see the Dynamo CLI help output, confirming the environment is set up.

---

## Troubleshooting

- If the container build fails, check the VSCode output panel for errors.
- Ensure Docker Desktop is running and has sufficient resources allocated.
- Restart VSCode and Docker Desktop if needed.

---

This guide ensures a complete environment setup for Oscar Broome and the Owlan Group to start development with NVIDIA Dynamo.
