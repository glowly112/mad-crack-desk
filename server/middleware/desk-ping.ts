/** Liveness probe — no SSR plant loader. Health cron hits /desk/ping. */

interface PingEvent {
  url: URL;
}

export default function deskPing(event: PingEvent, next: () => unknown) {
  const raw = event.url.pathname.replace(/\/$/, "");
  const path = raw.startsWith("/desk/") ? raw.slice("/desk".length) || "/" : raw;
  if (path === "/ping" || raw === "/desk/ping" || raw === "/ping") {
    return new Response("ok", {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
  return next();
}
