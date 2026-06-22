# setup.ps1 - Environment Setup script for RoadAid

$projectRoot = "C:\Users\hp\.gemini\antigravity-ide\scratch\road-aid"
$nodeEnvDir = "$projectRoot\node-env"
$zipPath = "$projectRoot\node.zip"
$nodeUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"

if (-not (Test-Path $projectRoot)) {
    New-Item -ItemType Directory -Path $projectRoot | Out-Null
    Write-Host "Created project directory: $projectRoot"
}

if (-not (Test-Path $nodeEnvDir)) {
    New-Item -ItemType Directory -Path $nodeEnvDir | Out-Null
}

$nodeBinPath = "$nodeEnvDir\node-v20.18.0-win-x64\node.exe"

if (Test-Path $nodeBinPath) {
    Write-Host "Node.js portable is already installed at: $nodeBinPath"
    Write-Host "Node Version:"
    & $nodeBinPath -v
    exit 0
}

Write-Host "Downloading Node.js portable from $nodeUrl ..."
try {
    # Set SecurityProtocol to TLS 1.2
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $nodeUrl -OutFile $zipPath -ErrorAction Stop
    Write-Host "Download complete. Extracting files to $nodeEnvDir..."
    
    Expand-Archive -Path $zipPath -DestinationPath $nodeEnvDir -Force
    Remove-Item -Path $zipPath -Force
    
    Write-Host "Extraction complete. Verifying installation..."
    if (Test-Path $nodeBinPath) {
        Write-Host "Success! Node.js installed."
        Write-Host "Version: " -NoNewline
        & $nodeBinPath -v
    } else {
        Write-Error "Could not find node.exe after extraction at $nodeBinPath"
        exit 1
    }
}
catch {
    Write-Error "Failed to install Node.js. Error: $_"
    exit 1
}
