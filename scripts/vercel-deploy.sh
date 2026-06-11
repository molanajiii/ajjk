#!/usr/bin/env bash
set -euo pipefail
# vercel-deploy.sh
# Sets Vercel env vars for a project and triggers a production deploy.
# Requires: curl, jq, and either VERCEL_TOKEN (recommended) or vercel CLI installed.

API_URL="https://api.vercel.com"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  read -rp "Enter VERCEL_TOKEN: " VERCEL_TOKEN
fi

PROJECT_NAME="${1:-}"
if [ -z "$PROJECT_NAME" ]; then
  read -rp "Enter Vercel project name: " PROJECT_NAME
fi

# Defaults — edit if needed
declare -A envs
envs=(
  [VITE_API_URL]="https://playbeat-backend.onrender.com"
  [VITE_STRIPE_PUBLISHABLE_KEY]="pk_test_51TMvD1K7C5jIjluKwjpb2ZJzlZoH4I9hxOwbcZkXr15wNvaLLX7wHpfeTw6Eu09O0aZDCpWo6ptHvoQjhloFApJ200lkcdWYVw"
)

echo "Resolving project $PROJECT_NAME..."
project_resp=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "$API_URL/v8/projects/$PROJECT_NAME")
project_id=$(echo "$project_resp" | jq -r .id)
if [ -z "$project_id" ] || [ "$project_id" = "null" ]; then
  echo "Failed to resolve project. Ensure the name is correct and token has access." >&2
  echo "$project_resp" | jq -C .
  exit 1
fi

echo "Found project id: $project_id"

# Get existing env vars for project
env_list=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "$API_URL/v9/projects/$project_id/env")

for key in "${!envs[@]}"; do
  value=${envs[$key]}
  echo "Setting $key=$value"
  existing_id=$(echo "$env_list" | jq -r --arg k "$key" '.[] | select(.key==$k and (.target|index("production"))) | .id' || true)
  if [ -n "$existing_id" ] && [ "$existing_id" != "null" ]; then
    echo "Updating $key..."
    curl -s -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
      -d "{\"value\":\"$value\"}" "$API_URL/v9/projects/$project_id/env/$existing_id" >/dev/null
  else
    echo "Creating $key..."
    curl -s -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
      -d "{\"key\":\"$key\",\"value\":\"$value\",\"target\":[\"production\"],\"type\":\"encrypted\"}" \
      "$API_URL/v9/projects/$project_id/env" >/dev/null
  fi
done

# Trigger deploy via vercel CLI if available
if command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI found. Triggering production deploy..."
  vercel --prod --confirm --token "$VERCEL_TOKEN"
else
  echo "vercel CLI not found. Install with 'npm i -g vercel' or run 'vercel --prod' in your frontend repo to deploy."
fi

echo "Done."
