#!/usr/bin/env pwsh
<##
vercel-deploy.ps1

Sets Vercel environment variables for a project and triggers a production deploy.
Uses VERCEL_TOKEN (or prompts) and a project name (or prompts).
Requires either the Vercel CLI installed or a valid VERCEL_TOKEN.

Usage:
  pwsh ./scripts/vercel-deploy.ps1 -ProjectName my-frontend-repo
  pwsh ./scripts/vercel-deploy.ps1 -NonInteractive -ProjectName my-frontend-repo

Defaults (edit below if desired):
  VITE_API_URL -> https://playbeat-backend.onrender.com
  VITE_STRIPE_PUBLISHABLE_KEY -> your publishable key

This script will:
  - Get the Vercel project ID
  - Create or update the provided env vars for production
  - Trigger a deploy with the `vercel` CLI if available (falls back to instructions)
#>

param(
  [string]$ProjectName = "",
  [switch]$NonInteractive
)

function PromptIfEmpty([string]$varName, [string]$current) {
  if ($current) { return $current }
  if ($NonInteractive) { Write-Error "$varName not set and running non-interactive"; exit 1 }
  return Read-Host "Enter value for $varName"
}

if (-not $env:VERCEL_TOKEN) {
  $env:VERCEL_TOKEN = Read-Host -Prompt 'Enter VERCEL_TOKEN (will be visible)'
}

$headers = @{ Authorization = "Bearer $env:VERCEL_TOKEN"; "Content-Type" = "application/json" }

if (-not $ProjectName) {
  $ProjectName = Read-Host 'Enter Vercel project name (as shown in Vercel)'
}

# Default vars - adjust as needed
$defaults = @{
  VITE_API_URL = 'https://playbeat-backend.onrender.com'
  VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_51TMvD1K7C5jIjluKwjpb2ZJzlZoH4I9hxOwbcZkXr15wNvaLLX7wHpfeTw6Eu09O0aZDCpWo6ptHvoQjhloFApJ200lkcdWYVw'
}

# Allow overriding via current environment
$envsToSet = @{}
foreach ($k in $defaults.Keys) {
  $value = $env:$k
  if (-not $value) { $value = $defaults[$k] }
  $envsToSet[$k] = PromptIfEmpty $k $value
}

# Resolve project id
$projectEndpoint = "https://api.vercel.com/v8/projects/$ProjectName"
try {
  $proj = Invoke-RestMethod -Uri $projectEndpoint -Headers $headers -Method Get -ErrorAction Stop
  $projectId = $proj.id
  Write-Host "Found Vercel project id: $projectId"
} catch {
  Write-Error "Failed to find project '$ProjectName'. Ensure the name is correct and the token has access. $_"
  exit 1
}

# List existing env vars
$envList = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$projectId/env" -Headers $headers -Method Get

function Upsert-EnvVar([string]$projectId, [string]$key, [string]$value) {
  $existing = $envList | Where-Object { $_.key -eq $key -and $_.target -contains 'production' }
  if ($existing) {
    $envId = $existing.id
    $body = @{ value = $value } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$projectId/env/$envId" -Headers $headers -Method Patch -Body $body
    Write-Host "Updated $key"
  } else {
    $body = @{ key = $key; value = $value; target = @('production'); type = 'encrypted' } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$projectId/env" -Headers $headers -Method Post -Body $body
    Write-Host "Created $key"
  }
}

foreach ($k in $envsToSet.Keys) {
  Upsert-EnvVar -projectId $projectId -key $k -value $envsToSet[$k]
}

# Trigger a deploy using vercel CLI if available
if (Get-Command vercel -ErrorAction SilentlyContinue) {
  Write-Host "vercel CLI found — triggering production deploy"
  $cmd = "vercel --prod --confirm --token $env:VERCEL_TOKEN"
  iex $cmd
} else {
  Write-Host "vercel CLI not found. Install it with 'npm i -g vercel' or run 'vercel --prod' manually."
}

Write-Host 'Vercel env var setup complete.'
