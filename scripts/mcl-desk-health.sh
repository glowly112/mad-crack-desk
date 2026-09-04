#!/bin/bash
# Oracle desk watchdog — restart hung :8791 before nginx serves 502.
# Probes lightweight /desk/ping (no SSR plant load). One flock per restart cycle.
set -eu
APP="${MCL_DESK_APP:-$HOME/mcl-desk}"
ROOT="${BBB_ROOT:-$HOME/bbb}"
NODE="${MCL_DESK_NODE:-$HOME/opt/node/bin/node}"
PING_URL="${MCL_DESK_PING_URL:-http://127.0.0.1:8791/desk/ping}"
DESK_URL="${MCL_DESK_URL:-http://127.0.0.1:8791/desk/}"
LOG="${MCL_DESK_HEALTH_LOG:-$ROOT/logs/mcl_desk_health.log}"
LOCK="${MCL_DESK_HEALTH_LOCK:-$APP/.health.lock}"
PROBE_TIMEOUT="${MCL_DESK_HEALTH_TIMEOUT:-5}"
STARTUP_WAIT_SEC="${MCL_DESK_STARTUP_WAIT_SEC:-30}"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

probe_ping() {
  curl -sS -m "$PROBE_TIMEOUT" -o /dev/null -w "%{http_code}" "$PING_URL" 2>/dev/null || echo "000"
}

probe_desk() {
  curl -sS -m "$PROBE_TIMEOUT" -o /dev/null -w "%{http_code}" "$DESK_URL" 2>/dev/null || echo "000"
}

port_busy() {
  if command -v ss >/dev/null 2>&1; then
    ss -tlnH sport = :8791 2>/dev/null | grep -q .
    return $?
  fi
  if command -v fuser >/dev/null 2>&1; then
    fuser 8791/tcp >/dev/null 2>&1
    return $?
  fi
  return 1
}

wait_port_free() {
  local i=0
  while port_busy && [ "$i" -lt 15 ]; do
    sleep 1
    i=$((i + 1))
  done
}

kill_desk() {
  echo "$(ts) kill: stopping desk on :8791" >>"$LOG"
  if [ -f "$APP/desk.pid" ]; then
    pid="$(cat "$APP/desk.pid" 2>/dev/null || true)"
    if [ -n "${pid:-}" ]; then
      kill -TERM "$pid" 2>/dev/null || true
      sleep 2
      kill -0 "$pid" 2>/dev/null && kill -KILL "$pid" 2>/dev/null || true
    fi
  fi
  pkill -TERM -f "$APP/.output/server/index.mjs" 2>/dev/null || true
  pkill -TERM -f "node .output/server/index.mjs" 2>/dev/null || true
  sleep 2
  pkill -KILL -f "$APP/.output/server/index.mjs" 2>/dev/null || true
  pkill -KILL -f "node .output/server/index.mjs" 2>/dev/null || true
  if command -v fuser >/dev/null 2>&1; then fuser -k 8791/tcp 2>/dev/null || true; fi
  wait_port_free
}

start_desk() {
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
}

wait_healthy() {
  local deadline=$((SECONDS + STARTUP_WAIT_SEC))
  while [ "$SECONDS" -lt "$deadline" ]; do
    code="$(probe_ping)"
    if [ "$code" = "200" ]; then
      return 0
    fi
    sleep 2
  done
  return 1
}

restart_desk() {
  echo "$(ts) restart: desk not healthy on $PING_URL" >>"$LOG"
  kill_desk
  start_desk || return 1
  if wait_healthy; then
    desk_code="$(probe_desk)"
    echo "$(ts) recovered ping=200 desk=$desk_code pid=$(cat "$APP/desk.pid" 2>/dev/null || echo unknown)" >>"$LOG"
    return 0
  fi
  echo "$(ts) restart failed ping=$(probe_ping) desk=$(probe_desk)" >>"$LOG"
  return 1
}

exec 9>"$LOCK"
if ! flock -n 9; then
  exit 0
fi

code="$(probe_ping)"
if [ "$code" = "200" ]; then
  exit 0
fi

echo "$(ts) unhealthy ping=$code — restarting desk" >>"$LOG"
restart_desk
