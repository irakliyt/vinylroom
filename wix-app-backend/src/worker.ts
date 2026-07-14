import type { SSRManifest } from "astro";
import { corsHeaders, handleHostEvent } from "./server/host-events";

type Env = {
  WIX_API_KEY: string;
  WIX_SITE_ID: string;
};

export function createExports(_manifest: SSRManifest) {
  return {
    default: {
      async fetch(request: Request, env: Env) {
        const { pathname } = new URL(request.url);

        if (pathname === "/api/health" && request.method === "GET") {
          return Response.json({ ok: true, service: "vinyl-room-events" });
        }

        if (pathname === "/api/host-events" && request.method === "OPTIONS") {
          return new Response(null, { status: 204, headers: corsHeaders(request) });
        }

        if (pathname === "/api/host-events" && request.method === "POST") {
          return handleHostEvent(request, {
            apiKey: env.WIX_API_KEY,
            siteId: env.WIX_SITE_ID,
          });
        }

        return Response.json({ error: "Not found." }, { status: 404 });
      },
    },
  };
}
