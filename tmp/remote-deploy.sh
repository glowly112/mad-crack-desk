#!/bin/bash
set -eu
APP="$HOME/mcl-desk"
ROOT="${BBB_ROOT:-$HOME/bbb}"
mkdir -p "$APP" "$ROOT/logs"
cat >"$APP/desk.env" <<EOF
HOST=127.0.0.1
PORT=8791
NITRO_HOST=127.0.0.1
NITRO_PORT=8791
BBB_ROOT=$ROOT
DESK_HTPASSWD=$ROOT/.secrets/desk.htpasswd
DESK_SESSION_SECRET=$(tr -d "\n" < "$ROOT/.secrets/desk.session")
DESK_COOKIE_SECURE=1
DESK_COOKIE_PATH=/desk
ORACLE_SCOREBOARD_PATH=$ROOT/data/firm/lab/latest/scoreboard.json
VITE_AUTH_ENABLED=false
NITRO_APP_BASE_URL=/desk/
DESK_BASEPATH=/desk
VITE_DESK_BASEPATH=/desk
PATH=$HOME/opt/node/bin:/usr/bin:/bin
EOF
if [ -f "$APP/desk.pid" ]; then kill "$(cat "$APP/desk.pid")" 2>/dev/null || true; fi
pkill -f "node .output/server/index.mjs" 2>/dev/null || true
pkill -f "$APP/.output/server/index.mjs" 2>/dev/null || true
sleep 2
if curl -sS -m 2 -o /dev/null -w "%{http_code}" http://127.0.0.1:8791/desk/ 2>/dev/null | grep -q 200; then
  pkill -9 -f "node .output/server/index.mjs" 2>/dev/null || true
  sleep 1
fi
cd "$APP"
rm -rf .output
tar xzf mcl-desk-out.tar.gz
set -a
source "$APP/desk.env"
set +a
nohup "$HOME/opt/node/bin/node" .output/server/index.mjs >>"$ROOT/logs/mcl_desk.log" 2>&1 &
echo $! >"$APP/desk.pid"
sleep 8
CSS=$(ls .output/public/assets/styles-*.css 2>/dev/null | head -1)
JS=$(ls .output/public/assets/index-*.js 2>/dev/null | head -1)
ROUTES=$(ls .output/public/assets/routes-*.js 2>/dev/null | head -1)
curl -sS -m 25 -o /dev/null -w "desk:%{http_code}\n" http://127.0.0.1:8791/desk/
curl -sS -m 25 -o /dev/null -w "css:%{http_code}\n" "http://127.0.0.1:8791/desk/assets/$(basename "$CSS")"
curl -sS -m 25 -o /dev/null -w "js:%{http_code}\n" "http://127.0.0.1:8791/desk/assets/$(basename "$JS")"
curl -sS -m 25 -o /dev/null -w "routes:%{http_code}\n" "http://127.0.0.1:8791/desk/assets/$(basename "$ROUTES")"
ps aux | grep 'node .output' | grep -v grep
