param(
    [string]$Image = "havit:verify",
    [string]$Container = "havit-verify",
    [int]$Port = 3301,
    [string]$DataDir = ""
)

$ErrorActionPreference = "Stop"
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

function Remove-VerifyContainer {
    param([string]$Name)
    $existing = docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq $Name }
    if ($existing) {
        docker rm -f $Name | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to remove existing container $Name"
        }
    }
}

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ($DataDir -eq "") {
    $DataDir = Join-Path $Root "tmp/docker-verify-data"
}
$ResolvedDataParent = (Resolve-Path (Join-Path $Root "tmp") -ErrorAction SilentlyContinue)
if (-not $ResolvedDataParent) {
    New-Item -ItemType Directory -Path (Join-Path $Root "tmp") | Out-Null
    $ResolvedDataParent = Resolve-Path (Join-Path $Root "tmp")
}

if (Test-Path $DataDir) {
    $resolved = (Resolve-Path $DataDir).Path
    if (-not $resolved.StartsWith($ResolvedDataParent.Path, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove data dir outside tmp: $resolved"
    }
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
New-Item -ItemType Directory -Path $DataDir | Out-Null

docker build -t $Image $Root
if ($LASTEXITCODE -ne 0) {
    throw "Docker build failed"
}

Remove-VerifyContainer -Name $Container
docker run -d `
    --name $Container `
    -p "${Port}:3000" `
    -v "${DataDir}:/data" `
    -e HAVIT_MODE=release `
    $Image | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Docker run failed"
}

try {
    $baseUrl = "http://localhost:$Port"
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $health = Invoke-WebRequest -Uri "$baseUrl/api/v1/healthz" -UseBasicParsing -TimeoutSec 2
            if ($health.StatusCode -eq 200 -and $health.Content -eq "ok") {
                $ready = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    if (-not $ready) {
        throw "Container did not become healthy"
    }

    $status = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/v1/system/status"
    if ($status.needs_setup -ne $true) {
        throw "Expected clean release container to require setup"
    }

    $setupBody = @{ username = "owner@example.com"; password = "secret123" } | ConvertTo-Json
    $setup = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/auth/setup" -ContentType "application/json" -Body $setupBody
    if ($setup.user.role -ne "owner" -or [string]::IsNullOrEmpty($setup.token)) {
        throw "Setup did not create an owner session"
    }

    docker restart $Container | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker restart failed"
    }
    Start-Sleep -Seconds 3

    $statusAfterRestart = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/v1/system/status"
    if ($statusAfterRestart.needs_setup -ne $false) {
        throw "Expected setup state to persist after container restart"
    }
    if (-not (Test-Path (Join-Path $DataDir "havit.db"))) {
        throw "Expected havit.db to exist in mounted data directory"
    }

    Write-Host "Docker verification passed: $Image on http://localhost:$Port"
} finally {
    Remove-VerifyContainer -Name $Container
}
