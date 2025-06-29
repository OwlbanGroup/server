# PowerShell script to download and install Rust on Windows

$rustupUrl = "https://win.rustup.rs/x86_64"
$installerPath = "$env:TEMP\rustup-init.exe"

Write-Host "Downloading Rust installer..."
Invoke-WebRequest -Uri $rustupUrl -OutFile $installerPath

Write-Host "Running Rust installer..."
Start-Process -FilePath $installerPath -ArgumentList "-y" -Wait

Write-Host "Rust installation completed."

Write-Host "Adding Rust to PATH for current session..."
$env:PATH += ";$env:USERPROFILE\.cargo\bin"

Write-Host "Verifying Rust installation..."
rustc --version
cargo --version

Write-Host "Rust setup script finished. Please restart your terminal or IDE to apply PATH changes."
