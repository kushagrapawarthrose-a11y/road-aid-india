# push-repo.ps1
$gitPath = "C:\Program Files\Git\cmd\git.exe"
$ghPath = "C:\Program Files\GitHub CLI\gh.exe"

$env:PATH = "C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:PATH

Write-Host "Initializing Git Repository..."
& $gitPath init

Write-Host "Configuring Git User..."
& $gitPath config user.name "RoadAid Dev"
& $gitPath config user.email "dev@roadaid.in"

Write-Host "Staging Files..."
& $gitPath add .

Write-Host "Committing Files..."
& $gitPath commit -m "Initial commit of RoadAid emergency coordination system"

Write-Host "Creating GitHub Repository 'road-aid-india' and pushing..."
& $ghPath repo create road-aid-india --public --source=. --remote=origin --push
