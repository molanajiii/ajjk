#!/usr/bin/env pwsh
<#
set-render-env.ps1

Interactive PowerShell script to add/update environment variables for a Render service
and trigger a manual deploy. It uses the `RENDER_API_KEY` environment variable (or
prompts for it) and tries to find the service named `playbeat-backend` by default.

Usage:
  - Set $env:RENDER_API_KEY in your session or enter when prompted.
  - Run: `pwsh .\scripts\set-render-env.ps1` or `./scripts/set-render-env.ps1`
#>

Param(
  [string]$ServiceId = "",
  [switch]$NonInteractive
)

if (-not $env:RENDER_API_KEY) {
  $prompt = "Enter your Render API key (input will be visible):"
  $env:RENDER_API_KEY = Read-Host $prompt
}

$headers = @{ Authorization = "Bearer $env:RENDER_API_KEY"; "Content-Type" = "application/json" }

function Get-ServiceIdByName([string]$name = 'playbeat-backend') {
  try {
    $services = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers -Method Get
  } catch {
    Write-Error "Failed to list services: $_"
    return $null
  }
  $match = $services | Where-Object { $_.name -eq $name }
  if ($match) { return $match.id }
  return $null
}

function Ensure-EnvVar([string]$serviceId, [string]$key, [string]$value, [bool]$secure = $true) {
  try {
    $list = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars" -Headers $headers -Method Get
  } catch {
    Write-Error "Failed to list env vars for service $serviceId: $_"
    return
  }
  $existing = $list | Where-Object { $_.key -eq $key }
  if ($existing) {
    $envId = $existing.id
    $body = @{ value = $value; secure = $secure } | ConvertTo-Json
    try {
      Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars/$envId" -Headers $headers -Method Patch -Body $body
      Write-Host "Updated env var: $key"
    } catch {
      Write-Error "Failed to update $key: $_"
    }
  } else {
    $body = @{ key = $key; value = $value; secure = $secure } | ConvertTo-Json
    try {
      Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars" -Headers $headers -Method Post -Body $body
      Write-Host "Created env var: $key"
    } catch {
      Write-Error "Failed to create $key: $_"
    }
  }
}

if (-not $ServiceId) {
  $ServiceId = Get-ServiceIdByName
  if ($ServiceId) {
    Write-Host "Found service 'playbeat-backend' with id: $ServiceId"
  } else {
    if ($NonInteractive) { Write-Error "Service not found and running non-interactive."; exit 1 }
    $ServiceId = Read-Host "Could not find service by name. Enter Render service id"
  }
}

# Edit these values as needed. Keep secrets private.
$envs = @{
  VITE_API_URL = 'https://playbeat-backend.onrender.com'
  VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_51TMvD1K7C5jIjluKwjpb2ZJzlZoH4I9hxOwbcZkXr15wNvaLLX7wHpfeTw6Eu09O0aZDCpWo6ptHvoQjhloFApJ200lkcdWYVw'
  MONGODB_URI = 'mongodb+srv://max11:<Cg8g7Q3v6zfWME2T>@playbeat.umqpdyx.mongodb.net/?appName=playbeat'
}

Write-Host "About to set the following environment variables on service $ServiceId:`n"
$envs.GetEnumerator() | ForEach-Object { Write-Host " - $($_.Key) = $($_.Value)" }

if (-not $NonInteractive) {
  $ans = Read-Host "Proceed to set these env vars and trigger a deploy? (y/N)"
  if ($ans -ne 'y' -and $ans -ne 'Y') { Write-Host 'Aborted by user.'; exit 0 }
}

foreach ($k in $envs.Keys) {
  Ensure-EnvVar -serviceId $ServiceId -key $k -value $envs[$k] -secure $true
}

try {
  Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/deploys" -Headers $headers -Method Post -Body '{}'
  Write-Host "Triggered deploy for service $ServiceId"
} catch {
  Write-Error "Failed to trigger deploy: $_"
}

Write-Host 'Done.'
