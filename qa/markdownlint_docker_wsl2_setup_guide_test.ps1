# PowerShell test script to check markdownlint compliance and rendering of docker_wsl2_setup_guide.md

# Check if markdownlint is installed
if (-not (Get-Command markdownlint -ErrorAction SilentlyContinue)) {
    Write-Host "markdownlint could not be found, please install it to run this test."
    exit 1
}

# Run markdownlint on the file
Write-Host "Running markdownlint on docker_wsl2_setup_guide.md..."
markdownlint docker_wsl2_setup_guide.md

if ($LASTEXITCODE -eq 0) {
    Write-Host "markdownlint passed with no errors."
} else {
    Write-Host "markdownlint found issues. Please review the output above."
}

# Optional: Render markdown to HTML using pandoc if installed
if (Get-Command pandoc -ErrorAction SilentlyContinue) {
    Write-Host "Rendering markdown to HTML using pandoc for visual inspection..."
    pandoc docker_wsl2_setup_guide.md -o $env:TEMP\docker_wsl2_setup_guide.html
    Write-Host "HTML output saved to $env:TEMP\docker_wsl2_setup_guide.html"
} else {
    Write-Host "pandoc not found, skipping markdown rendering test."
}

Write-Host "Test completed."
