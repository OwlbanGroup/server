# PowerShell script to set environment variables permanently on Windows

# Set DYNAMICS365_BASE_URL permanently for the current user
[Environment]::SetEnvironmentVariable("DYNAMICS365_BASE_URL", "https://your-dynamics365-api-url", "User")

# Set DYNAMICS365_ACCESS_TOKEN permanently for the current user
[Environment]::SetEnvironmentVariable("DYNAMICS365_ACCESS_TOKEN", "your-access-token", "User")

Write-Host "Environment variables DYNAMICS365_BASE_URL and DYNAMICS365_ACCESS_TOKEN have been set permanently for the current user."
Write-Host "Please restart your terminal or IDE to apply the changes."
