#!/usr/bin/env bash
#
# Initialize PocketBase database for Digital Twin
#
# Usage:
#   ./scripts/init-db.sh                                # interactive
#   ./scripts/init-db.sh admin@example.com MyPassword10  # non-interactive
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PB_DIR="$ROOT_DIR/pb_runtime"
PB_BIN="$PB_DIR/pocketbase"
SEED_FILE="$ROOT_DIR/scripts/seed-data.sql"

# ── Check PocketBase binary ──────────────────────────────────
if [ ! -x "$PB_BIN" ]; then
  echo "Error: PocketBase binary not found at $PB_BIN"
  echo ""
  echo "Download it from https://pocketbase.io/docs/"
  echo "and place it at: $PB_BIN"
  exit 1
fi

# ── Check if already initialized ────────────────────────────
if [ -f "$PB_DIR/pb_data/data.db" ]; then
  echo "Database already exists at $PB_DIR/pb_data/data.db"
  read -rp "Reset and reinitialize? (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
  fi
  echo "Removing existing database..."
  rm -rf "$PB_DIR/pb_data"
fi

# ── Get superuser credentials ───────────────────────────────
EMAIL="${1:-}"
PASSWORD="${2:-}"

if [ -z "$EMAIL" ]; then
  read -rp "Admin email: " EMAIL
fi

if [ -z "$PASSWORD" ]; then
  read -rsp "Admin password (min 10 chars): " PASSWORD
  echo ""
fi

if [ ${#PASSWORD} -lt 10 ]; then
  echo "Error: Password must be at least 10 characters."
  exit 1
fi

# ── Run migrations (creates collections: buildings, settings) ─
echo ""
echo "Running migrations..."
"$PB_BIN" migrate up --dir="$PB_DIR/pb_data" --migrationsDir="$PB_DIR/pb_migrations"

# ── Create superuser ────────────────────────────────────────
echo "Creating superuser $EMAIL..."
"$PB_BIN" superuser create "$EMAIL" "$PASSWORD" --dir="$PB_DIR/pb_data"

# ── Seed building data ──────────────────────────────────────
if [ -f "$SEED_FILE" ]; then
  echo "Loading seed data ($(wc -l < "$SEED_FILE" | tr -d ' ') buildings)..."
  sqlite3 "$PB_DIR/pb_data/data.db" < "$SEED_FILE"
  echo "Done."
else
  echo "No seed data found at $SEED_FILE (skipping)."
fi

# ── Cesium Ion token ─────────────────────────────────────────
echo ""
echo "The app requires a Cesium Ion access token for 3D tiles."
echo "Get one free at: https://ion.cesium.com/tokens"
echo ""
echo "Add it in the PocketBase admin panel after starting the server:"
echo "  1. Go to http://127.0.0.1:8090/_/"
echo "  2. Open the 'settings' collection"
echo "  3. Create a record: key = cesium_token, value = <your token>"

echo ""
echo "=== Setup complete ==="
echo ""
echo "Start the server:"
echo "  cd pb_runtime && ./pocketbase serve --http=0.0.0.0:8090"
echo ""
echo "Admin panel:  http://127.0.0.1:8090/_/"
echo "Frontend dev: cd frontend && npm run dev"
echo ""
