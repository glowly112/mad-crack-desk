#!/bin/bash
# Oracle desk watchdog — restart hung :8791 before nginx serves 502 for hours.
set -eu
APP="${MCL_DESK_APP:-$HOME/mcl-desk}"
ROOT="${BBB_ROOT:-$HOME/bbb}"
NODE="${MCL_DESK_NODE:-$HOME/opt/node/bin/node}"
URL="http://127.0.0.1:8791/desk/"
LOG="${MCL_DESK_HEALTH_LOG:-$ROOT/logs/mcl_desk_health.log}"
TIMEOUT="${MCL_DESK_HEALTH_TIMEOUT:-8}"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

probe() {
  curl -sS -m "$TIMEOUT" -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000"
}

restart_desk() {
  echo "$(ts) restart: desk not healthy on $URL" >>"$LOG"
  if [ -f "$APP/desk.pid" ]; then kill "$(cat "$APP/desk.pid")" 2>/dev/null || true; fi
  pkill -f "$APP/.output/server/index.mjs" 2>/dev/null || true
  pkill -f "node .output/server/index.mjs" 2>/dev/null || true
  if command -v fuser >/dev/null 2>&1; then fuser -k 8791/tcp 2>/dev/null || true; fi
  sleep 2
  if [ ! -f "$APP/.output/server/index.mjs" ]; then
    echo "$(ts) restart: missing $APP/.output/server/index.mjs" >>"$LOG"
    return 1
  fi
  cd "$APP"
  set -a
  # shellcheck disable=SC1090
  source "$APP/desk.env"
  set +a
  nohup "$NODE" .output/server/index.mjs >>"$ROOT/logs/mcl_desk.log" 2>&1 &
  echo $! >"$APP/desk.pid"
  sleep 6
}

code="$(probe)"
if [ "$code" = "200" ]; then
  exit 0
fi

echo "$(ts) unhealthy http=$code — restarting desk" >>"$LOG"
restart_desk || exit 1
code="$(probe)"
if [ "$code" = "200" ]; then
  echo "$(ts) recovered http=200 pid=$(cat "$APP/desk.pid" 2>/dev/null || echo unknown)" >>"$LOG"
  exit 0
fi
echo "$(ts) restart failed http=$code" >>"$LOG"
exit 1
