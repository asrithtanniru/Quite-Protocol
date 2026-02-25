#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PY_BIN="$($ROOT_DIR/scripts/_python.sh)"

cd "$ROOT_DIR"
exec "$PY_BIN" tools/livekit_multi_character.py dev
