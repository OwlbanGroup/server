# Setting Environment Variables Permanently on Windows

To set environment variables permanently on Windows, follow these steps:

1. Open the Start menu and search for "Environment Variables".
2. Click on "Edit the system environment variables".
3. In the System Properties window, click the "Environment Variables..." button.
4. Under "User variables" or "System variables", click "New...".
5. Enter the variable name and value:
   - Variable name: DYNAMICS365_BASE_URL
   - Variable value: https://your-dynamics365-api-url
6. Click OK.
7. Repeat steps 4-6 for the second variable:
   - Variable name: DYNAMICS365_ACCESS_TOKEN
   - Variable value: your-access-token
8. Click OK to close all dialogs.
9. Restart your terminal or IDE to apply the changes.

After setting these variables, you can run your Node.js scripts, and they will have access to these environment variables.

If you want, I can assist you with verifying the environment variables or running the synchronization script after this setup.
