#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PY_BIN="$($ROOT_DIR/scripts/_python.sh)"

cd "$ROOT_DIR"
exec "$PY_BIN" -m uvicorn agents.infrastructure.api:app --host 0.0.0.0 --port 8000 --app-dir src
