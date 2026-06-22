# run-node.ps1
param(
    [string]$command,
    [parameter(ValueFromRemainingArguments=$true)]
    [string[]]$remainingArgs
)

$nodeDir = "C:\Users\hp\.gemini\antigravity-ide\scratch\road-aid\node-env\node-v20.18.0-win-x64"

# Set PATH
$env:PATH = "$nodeDir;" + $env:PATH

if ($command -eq "npm") {
    $npmCmd = "$nodeDir\npm.cmd"
    if ($remainingArgs) {
        & $npmCmd $remainingArgs
    } else {
        & $npmCmd
    }
} elseif ($command -eq "npx") {
    $npxCmd = "$nodeDir\npx.cmd"
    if ($remainingArgs) {
        & $npxCmd $remainingArgs
    } else {
        & $npxCmd
    }
} else {
    $nodeCmd = "$nodeDir\node.exe"
    $allArgs = @()
    if ($command) { $allArgs += $command }
    if ($remainingArgs) { $allArgs += $remainingArgs }
    
    if ($allArgs.Length -gt 0) {
        & $nodeCmd $allArgs
    } else {
        & $nodeCmd
    }
}
