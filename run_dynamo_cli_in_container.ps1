# PowerShell script to open the NVIDIA Dynamo project in VSCode dev container and run the dynamo CLI help command

# Step 1: Open VSCode in the project directory
$projectPath = "C:\\Users\\David L\\OneDrive\\Documents\\GitHub\\Organizational-Leadership-Telehealth\\dynamo"

Write-Host "Opening VSCode in project directory..."
Start-Process code $projectPath

Write-Host "Please use the 'Reopen in Container' option in VSCode to start the dev container."
Write-Host "Once the container is running, open a terminal inside VSCode and run the following command:"
Write-Host "dynamo --help"

Write-Host "This script cannot automate VSCode UI interactions, so please perform the above steps manually."
