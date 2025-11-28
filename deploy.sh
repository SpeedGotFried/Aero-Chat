#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Ensure docker is present
if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found. Run Docker Desktop and enable WSL integration."
  exit 1
fi



# Start stack
docker compose -f "$ROOT/docker-compose.yml" up -d --build

echo "Stack started. Web -> http://localhost:3000   App -> http://localhost:5000"
