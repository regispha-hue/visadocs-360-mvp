#!/bin/bash
# Nexoritia OS - Deploy Script | Otimizado
set -e

echo "╔═══════════════════════════════════════════════╗"
echo "║     NEXORITIA OS v2.0 - DEPLOY SCRIPT         ║"
echo "╠═══════════════════════════════════════════════╣"
echo "║  Railway / Heroku / VPS Deploy                ║"
echo "╚═══════════════════════════════════════════════╝"

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CORE_DIR="$BASE_DIR/1_NEXORITIA_OS_CORE"
API_DIR="$BASE_DIR/2_API_SERVER"
DATA_DIR="$API_DIR/data"

echo ""
echo "[1/5] Environment Check..."
python3 --version || python --version
cd "$BASE_DIR"

# Setup directories
echo ""
echo "[2/5] Creating directories..."
mkdir -p "$DATA_DIR"
mkdir -p ~/.auth-ai/keys

# Generate canon
echo ""
echo "[3/5] Generating canon..."
cd "$CORE_DIR"
python3 generate_canon.py || python generate_canon.py
cp canon_v1.0.json "$DATA_DIR/"

# Install deps
echo ""
echo "[4/5] Installing dependencies..."
pip3 install fastapi uvicorn pydantic cryptography requests python-dateutil || \
pip install fastapi uvicorn pydantic cryptography requests python-dateutil

# Start server
echo ""
echo "[5/5] Starting Nexoritia OS API..."
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║         NEXORITIA OS v2.0 RUNNING             ║"
echo "╠═══════════════════════════════════════════════╣"
echo "║  API:    http://localhost:8000                ║"
echo "║  Docs:   http://localhost:8000/docs           ║"
echo "║  Health: http://localhost:8000/               ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

cd "$API_DIR"
python3 main.py || python main.py
