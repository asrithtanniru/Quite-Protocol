#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
  echo "$ROOT_DIR/.venv/bin/python"
  exit 0
fi

if [[ -x "$ROOT_DIR/venv/bin/python" ]]; then
  echo "$ROOT_DIR/venv/bin/python"
  exit 0
fi

if [[ -x "$ROOT_DIR/../.venv/bin/python" ]]; then
  echo "$ROOT_DIR/../.venv/bin/python"
  exit 0
fi

if command -v python3 >/dev/null 2>&1; then
  command -v python3
  exit 0
fi

echo "No python interpreter found" >&2
exit 1
