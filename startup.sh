#!/bin/bash
# Idempotent dev preview on 8080 for Grok live preview.
if curl -sf --max-time 2 http://127.0.0.1:8080/ >/dev/null 2>&1; then
  exit 0
fi
cd "$(dirname "$0")"
npm run dev >> /tmp/mcl-desk-dev.log 2>&1 &
echo $! > /tmp/mcl-desk-dev.pid
for _ in $(seq 1 60); do
  if curl -sf --max-time 2 http://127.0.0.1:8080/ >/dev/null 2>&1; then
    exit 0
  fi
  sleep 1
done
echo "desk dev failed to bind 8080" >&2
exit 1
