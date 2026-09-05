/** Durable liveness route — registered before TanStack catch-all; no plant loader. */

import { defineHandler } from "h3";

export default defineHandler(() => {
  return new Response("ok", {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
});
