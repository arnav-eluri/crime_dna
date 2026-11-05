#!/usr/bin/env pwsh
# dev.ps1 — one-shot: run pipeline, then start UI
# Usage: .\dev.ps1
#        .\dev.ps1 --skip-pipeline   (skip if data already exists)
#        .\dev.ps1 --real --limit 5000 (use real Kaggle CSV, limit rows)

param(
    [switch]$SkipPipeline,
    [switch]$Real,
    [int]$Limit = 0
)

$root = $PSScriptRoot
$dataProcessing = Join-Path $root "data_processing"
$orchestration  = Join-Path $dataProcessing "orchestration"
$clientDir      = Join-Path $root "client"

# ── helpers ──────────────────────────────────────────────────────────────────
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Err($msg)  { Write-Host "    [ERR] $msg" -ForegroundColor Red; exit 1 }

# ── 1. Python deps ────────────────────────────────────────────────────────────
Step "Installing Python dependencies"
pip install -q -r (Join-Path $dataProcessing "requirements.txt")
if ($LASTEXITCODE -ne 0) { Err "pip install failed" }
Ok "Python deps ready"

# ── 2. Pipeline ───────────────────────────────────────────────────────────────
if (-not $SkipPipeline) {
    Step "Running data pipeline"

    $pipelineArgs = @("main.py", "--no-classification")

    if ($Real) {
        $pipelineArgs += "--run", "--source", "real"
        if ($Limit -gt 0) { $pipelineArgs += "--limit", $Limit }
    } else {
        $pipelineArgs += "--all"
    }

    Push-Location $orchestration
    python @pipelineArgs
    $exitCode = $LASTEXITCODE
    Pop-Location

    if ($exitCode -ne 0) { Err "Pipeline failed (exit $exitCode)" }
    Ok "Pipeline complete — artifacts written to data_processing/data/03_processed/"
} else {
    Step "Skipping pipeline (--skip-pipeline flag)"
}

# ── 3. Node deps ──────────────────────────────────────────────────────────────
Step "Checking Node dependencies"
if (-not (Test-Path (Join-Path $clientDir "node_modules"))) {
    Push-Location $clientDir
    npm install --silent
    if ($LASTEXITCODE -ne 0) { Err "npm install failed" }
    Pop-Location
    Ok "node_modules installed"
} else {
    Ok "node_modules already present"
}

# ── 4. Open browser then start dev server ─────────────────────────────────────
Step "Starting UI (Vite + API)"
Write-Host "    Frontend : http://localhost:5173" -ForegroundColor Yellow
Write-Host "    API      : http://localhost:3000" -ForegroundColor Yellow
Write-Host "    Press Ctrl+C to stop`n"

Start-Sleep -Seconds 1
Start-Process "http://localhost:5173"

Push-Location $clientDir
npm run dev
Pop-Location
