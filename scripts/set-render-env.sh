#!/usr/bin/env bash
set -euo pipefail

# set-render-env.sh
# Create or update Render environment variables for the playbeat-backend service
# and trigger a manual deploy. Requires `jq` and `curl`.

API="https://api.render.com/v1"

if [ -z "${RENDER_API_KEY:-}" ]; then
  read -rp "Enter Render API key: " RENDER_API_KEY
fi

SERVICE_ID="${1:-}"

if [ -z "$SERVICE_ID" ]; then
  echo "Looking up service id for 'playbeat-backend'..."
  SERVICE_ID=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" "$API/services" | jq -r '.[] | select(.name=="playbeat-backend") .id')
  if [ -z "$SERVICE_ID" ]; then
    read -rp "Service not found. Enter Render service id: " SERVICE_ID
  else
    echo "Found service id: $SERVICE_ID"
  fi
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "This script requires 'jq'. Install it and re-run."
  exit 1
fi

declare -A envs
envs=(
  [VITE_API_URL]="https://playbeat-backend.onrender.com"
  [VITE_STRIPE_PUBLISHABLE_KEY]="pk_test_51TMvD1K7C5jIjluKwjpb2ZJzlZoH4I9hxOwbcZkXr15wNvaLLX7wHpfeTw6Eu09O0aZDCpWo6ptHvoQjhloFApJ200lkcdWYVw"
  [MONGODB_URI]="mongodb+srv://max11:<Cg8g7Q3v6zfWME2T>@playbeat.umqpdyx.mongodb.net/?appName=playbeat"
)

echo "About to set the following environment variables on service $SERVICE_ID:"
for k in "${!envs[@]}"; do printf " - %s=%s\n" "$k" "${envs[$k]}"; done

read -rp "Proceed to set these env vars and trigger a deploy? (y/N) " ans
if [[ "$ans" != "y" && "$ans" != "Y" ]]; then
  echo "Aborted by user."
  exit 0
fi

for key in "${!envs[@]}"; do
  value="${envs[$key]}"
  existing_id=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" "$API/services/$SERVICE_ID/env-vars" | jq -r --arg k "$key" '.[] | select(.key==$k) | .id // empty')
  if [ -n "$existing_id" ]; then
    echo "Updating $key..."
    jq -n --arg v "$value" '{value:$v,secure:true}' | \
      curl -s -X PATCH -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" -d @- "$API/services/$SERVICE_ID/env-vars/$existing_id" >/dev/null
  else
    echo "Creating $key..."
    jq -n --arg k "$key" --arg v "$value" '{key:$k,value:$v,secure:true}' | \
      curl -s -X POST -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" -d @- "$API/services/$SERVICE_ID/env-vars" >/dev/null
  fi
done

echo "Triggering deploy..."
curl -s -X POST -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" -d '{}' "$API/services/$SERVICE_ID/deploys" >/dev/null

echo "Deploy triggered."
