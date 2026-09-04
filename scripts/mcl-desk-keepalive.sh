#!/bin/bash
# Lightweight keepalive — ping only; delegate restart to mcl-desk-health.sh (flocked).
set -eu
APP="${MCL_DESK_APP:-$HOME/mcl-desk}"
PING_URL="${MCL_DESK_PING_URL:-http://127.0.0.1:8791/desk/ping}"
TIMEOUT="${MCL_DESK_HEALTH_TIMEOUT:-5}"
HEALTH="${MCL_DESK_HEALTH_SH:-$APP/mcl-desk-health.sh}"

if curl -sf -o /dev/null --max-time "$TIMEOUT" "$PING_URL"; then
  exit 0
fi

if [ -x "$HEALTH" ]; then
  exec "$HEALTH"
fi

exit 1
