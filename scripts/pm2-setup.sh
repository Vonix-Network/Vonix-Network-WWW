#!/usr/bin/env bash
# PM2 setup and process bootstrap for Vonix Network
# Usage examples:
#   ./scripts/pm2-setup.sh                # install pm2 if needed, build, start web+bot, enable startup
#   ./scripts/pm2-setup.sh --only web     # only manage web
#   ./scripts/pm2-setup.sh --only bot     # only manage bot
#   ./scripts/pm2-setup.sh --skip-build   # skip build step
#   ./scripts/pm2-setup.sh --force-restart # force restart processes

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ONLY=""
SKIP_BUILD="false"
FORCE_RESTART="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)
      ONLY="${2:-}"; shift 2 ;;
    --skip-build)
      SKIP_BUILD="true"; shift ;;
    --force-restart)
      FORCE_RESTART="true"; shift ;;
    *)
      echo "Unknown option: $1" ; exit 1 ;;
  esac
done

cd "$PROJECT_DIR"

echo "[PM2] Checking prerequisites..."
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed. Install Node.js 22 LTS on the VPS, then rerun." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm is not installed. Install Node.js/npm and rerun." >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[PM2] pm2 not found. Installing globally..."
  sudo npm install -g pm2
  # Refresh pm2 runtime
  pm2 update || true
else
  echo "[PM2] pm2 is installed: $(pm2 -v)"
fi

# Install deps if node_modules missing
if [[ ! -d node_modules ]]; then
  echo "[PM2] Installing dependencies..."
  npm install
fi

if [[ "$SKIP_BUILD" != "true" ]]; then
  echo "[PM2] Building Next.js app..."
  npm run build
else
  echo "[PM2] Skipping build as requested."
fi

start_or_restart() {
  local name="$1"; shift
  local start_cmd=("pm2" "start" "$@" "--name" "$name")

  if pm2 describe "$name" >/dev/null 2>&1; then
    if [[ "$FORCE_RESTART" == "true" ]]; then
      echo "[PM2] Forcing restart: $name"
      pm2 restart "$name"
    else
      echo "[PM2] Process exists, starting if stopped: $name"
      pm2 start "$name" || true
    fi
  else
    echo "[PM2] Starting: $name"
    "${start_cmd[@]}"
  fi
}

manage_web=true
manage_bot=true

if [[ -n "$ONLY" ]]; then
  case "$ONLY" in
    web) manage_bot=false ;;
    bot) manage_web=false ;;
    *) echo "[ERROR] --only must be 'web' or 'bot'"; exit 1 ;;
  esac
fi

if [[ "$manage_web" == "true" ]]; then
  # Next.js production server via npm start
  start_or_restart "vonix-web" npm -- start
fi

if [[ "$manage_bot" == "true" ]]; then
  # Guard bot env requirements
  if [[ -z "${DISCORD_BOT_TOKEN:-}" || -z "${DISCORD_CHANNEL_ID:-}" ]]; then
    echo "[WARN] DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID not set in this shell."
    echo "       PM2 will still start using environment from your .env/.systemd if configured."
  fi
  # Start discord bot via npm run bot
  start_or_restart "vonix-bot" npm -- run bot
fi

# Enable pm2 on startup
# 'pm2 startup' usually needs sudo; construct command from pm2 output
if command -v systemctl >/dev/null 2>&1; then
  echo "[PM2] Configuring systemd startup..."
  STARTUP_CMD=$(pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1 || true)
  if [[ -n "$STARTUP_CMD" ]]; then
    echo "[PM2] Running: $STARTUP_CMD"
    eval "$STARTUP_CMD"
  fi
else
  echo "[PM2] systemd not found; skipping pm2 startup configuration."
fi

# Save current process list
pm2 save

# Show status and useful commands
pm2 status

echo
echo "[DONE] PM2 setup complete. Useful commands:"
echo "  pm2 status"
echo "  pm2 logs vonix-web --lines 100"
echo "  pm2 logs vonix-bot --lines 100"
echo "  pm2 restart vonix-web && pm2 restart vonix-bot"
echo "  pm2 save"
echo "  pm2 startup"
