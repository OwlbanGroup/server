# PowerShell script to set environment variables for Dynamics365 API

# Prompt user to enter actual values for environment variables
$baseUrl = Read-Host "Enter your Dynamics365 API base URL"
$accessToken = Read-Host "Enter your Dynamics365 API access token"

$env:DYNAMICS365_BASE_URL = $baseUrl
$env:DYNAMICS365_ACCESS_TOKEN = $accessToken

Write-Host "Environment variables DYNAMICS365_BASE_URL and DYNAMICS365_ACCESS_TOKEN have been set for this session."

# To persist these variables, you can add them to your system environment variables or user environment variables.
# This script sets them only for the current PowerShell session.
