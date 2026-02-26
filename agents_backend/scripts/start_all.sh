#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  jobs -p | xargs -r kill >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

"$ROOT_DIR/scripts/start_api.sh" &
API_PID=$!

"$ROOT_DIR/scripts/start_worker.sh" &
WORKER_PID=$!

wait "$API_PID" "$WORKER_PID"
