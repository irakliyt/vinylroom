import { createClient, OAuthStrategy } from "@wix/sdk";
import { wixEventsV2, orders, ticketDefinitions } from "@wix/events";
import { redirects } from "@wix/redirects";
import { WIX_CLIENT_ID, isWixConfigured } from "./config";

/**
 * A single Wix Headless client wired with the Events + redirects modules.
 *
 * `OAuthStrategy` with only a client ID mints anonymous **visitor** tokens
 * automatically, which is all we need to read published events and start a
 * ticket checkout. Returns `null` when no client ID is configured so callers
 * can fall back to demo data.
 */
export function getWixClient() {
  if (!isWixConfigured) return null;
  return createClient({
    modules: { wixEventsV2, orders, ticketDefinitions, redirects },
    auth: OAuthStrategy({ clientId: WIX_CLIENT_ID }),
  });
}

export type WixClient = NonNullable<ReturnType<typeof getWixClient>>;
