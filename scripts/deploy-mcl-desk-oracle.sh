#!/bin/bash
# Build and hot-swap Mad Crack Lab desk on Oracle (8791). Display only.
set -eu
cd "$(dirname "$0")/../"
HOST="${ORACLE_SSH_HOST:-ubuntu@140.238.126.80}"
KEY="${MULTIBOT_SSH_ORACLE_HRBOT_KEY:-}"
SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [ -n "$KEY" ] && echo "$KEY" | grep -q "BEGIN OPENSSH PRIVATE KEY"; then
  KF=$(mktemp)
  printf '%s\n' "$KEY" >"$KF"
  chmod 600 "$KF"
  SSH_OPTS+=(-i "$KF")
fi

export VITE_DESK_BASEPATH=/desk
export DESK_BASEPATH=/desk
export NITRO_PRESET=node-server
npm run build

if [ ! -f .output/server/index.mjs ]; then
  echo "missing .output/server/index.mjs — ensure NITRO_PRESET=node-server" >&2
  exit 1
fi

tar czf /tmp/mcl-desk-out.tar.gz .output scripts/mcl-desk-health.sh scripts/mcl-desk-keepalive.sh
scp "${SSH_OPTS[@]}" /tmp/mcl-desk-out.tar.gz "$HOST:~/mcl-desk/mcl-desk-out.tar.gz"
scp "${SSH_OPTS[@]}" scripts/mcl-desk-health.sh "$HOST:~/mcl-desk/mcl-desk-health.sh"
scp "${SSH_OPTS[@]}" scripts/mcl-desk-keepalive.sh "$HOST:~/mcl-desk/mcl-desk-keepalive.sh"
scp "${SSH_OPTS[@]}" scripts/mcl-desk-keepalive.sh "$HOST:~/bbb/deploy/mcl-desk-keepalive.sh"
scp "${SSH_OPTS[@]}" scripts/nginx/mcl-desk.conf "$HOST:~/mcl-desk/mcl-desk.conf"

ssh "${SSH_OPTS[@]}" "$HOST" 'set -eu
# Nitro baseURL=/desk/ — nginx must proxy /desk/assets/ → node /desk/assets/ (not /assets/).
if [ -f /etc/nginx/snippets/mcl-desk.conf ]; then
  sudo cp "$HOME/mcl-desk/mcl-desk.conf" /etc/nginx/snippets/mcl-desk.conf
  sudo nginx -t && sudo systemctl reload nginx
fi
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
ORACLE_PLANT_CACHE_MS=3000
ORACLE_HOLLOW_CACHE_MS=5000
ORACLE_PLANT_LOAD_TIMEOUT_MS=12000
MCL_DESK_PING_URL=http://127.0.0.1:8791/desk/ping
EOF
kill_stale_desk() {
  if [ -f "$APP/desk.pid" ]; then kill "$(cat "$APP/desk.pid")" 2>/dev/null || true; fi
  pkill -f "node .output/server/index.mjs" 2>/dev/null || true
  pkill -f "$APP/.output/server/index.mjs" 2>/dev/null || true
  if command -v fuser >/dev/null 2>&1; then fuser -k 8791/tcp 2>/dev/null || true; fi
  sleep 2
  if curl -sS -m 2 -o /dev/null -w "%{http_code}" http://127.0.0.1:8791/desk/ 2>/dev/null | grep -q 200; then
    pkill -9 -f "node .output/server/index.mjs" 2>/dev/null || true
    if command -v fuser >/dev/null 2>&1; then fuser -k 8791/tcp 2>/dev/null || true; fi
    sleep 1
  fi
}
kill_stale_desk
cd "$APP"
rm -rf .output
tar xzf mcl-desk-out.tar.gz
set -a
source "$APP/desk.env"
set +a
nohup "$HOME/opt/node/bin/node" .output/server/index.mjs >>"$ROOT/logs/mcl_desk.log" 2>&1 &
echo $! >"$APP/desk.pid"
deadline=$((SECONDS + 30))
while [ "$SECONDS" -lt "$deadline" ]; do
  code=$(curl -sS -m 3 -o /dev/null -w "%{http_code}" http://127.0.0.1:8791/desk/ping 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then break; fi
  sleep 1
done
CSS=$(ls .output/public/assets/styles-*.css 2>/dev/null | head -1)
JS=$(ls .output/public/assets/index-*.js 2>/dev/null | head -1)
curl -sS -m 25 -o /dev/null -w "desk:%{http_code}\n" http://127.0.0.1:8791/desk/
curl -sS -m 5 -o /dev/null -w "ping:%{http_code}\n" http://127.0.0.1:8791/desk/ping
curl -sS -m 25 -o /dev/null -w "css:%{http_code}\n" "http://127.0.0.1:8791/desk/assets/$(basename "$CSS")"
curl -sS -m 25 -o /dev/null -w "js:%{http_code}\n" "http://127.0.0.1:8791/desk/assets/$(basename "$JS")"
curl -sS -m 25 -L http://127.0.0.1:8791/desk/ | python3 -c "
import sys,re
t=sys.stdin.read()
t2=re.sub(r\"<script[^>]*>.*?</script>\",\"\",t,flags=re.S)
t2=re.sub(r\"<[^>]+>\",\" \",t2)
words=\" \".join(t2.split())
m=re.search(r\"(\d+) empty of (\d+)\", words)
print(\"empty\", m.groups() if m else None)
print(\"square\", \"The square\" in words)
stamps=sorted(set(re.findall(r\"20\d{6}T\d{6}Z\", t)))
print(\"stamp\", stamps[-1] if stamps else \"none\")
print(\"live\", words.count(\"live oracle\"))
"
ping_code=$(curl -sS -m 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:8791/desk/ping 2>/dev/null || echo 000)
if [ "$ping_code" != "200" ]; then
  echo "deploy: /desk/ping not healthy (got $ping_code)" >&2
  tail -30 "$ROOT/logs/mcl_desk.log" >&2 || true
  exit 1
fi
chmod +x "$APP/mcl-desk-health.sh" 2>/dev/null || true
chmod +x "$APP/mcl-desk-keepalive.sh" 2>/dev/null || true
chmod +x "$HOME/bbb/deploy/mcl-desk-keepalive.sh" 2>/dev/null || true
HEALTH_SH="$APP/mcl-desk-health.sh"
KEEPALIVE_SH="$HOME/bbb/deploy/mcl-desk-keepalive.sh"
if [ -f "$HEALTH_SH" ]; then
  chmod +x "$HEALTH_SH"
  (crontab -l 2>/dev/null | grep -v mcl-desk-health || true; echo "*/2 * * * * $HEALTH_SH >>$ROOT/logs/mcl_desk_health.log 2>&1") | crontab -
fi
if [ -f "$KEEPALIVE_SH" ]; then
  chmod +x "$KEEPALIVE_SH"
  (crontab -l 2>/dev/null | grep -v mcl-desk-keepalive || true; echo "*/3 * * * * $KEEPALIVE_SH >>$ROOT/logs/mcl_desk_health.log 2>&1") | crontab -
  "$KEEPALIVE_SH" || true
elif [ -f "$HEALTH_SH" ]; then
  "$HEALTH_SH" || true
fi
'
rm -f "$KF" 2>/dev/null || true
