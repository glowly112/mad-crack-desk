/** Liveness probe — no SSR plant loader. Health cron hits /desk/ping. */

interface PingEvent {
  url: URL;
}

export default function deskPing(event: PingEvent, next: () => unknown) {
  const path = event.url.pathname.replace(/\/$/, "");
  if (path === "/ping" || path === "/desk/ping") {
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
