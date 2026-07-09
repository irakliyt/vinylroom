import "server-only";
import { rooms as demoRooms, type Room } from "@/data/rooms";
import { getWixClient } from "./client";

export type RoomsResult = {
  rooms: Room[];
  source: "wix" | "mock";
};

/** Money like `{ amount: "45", currency: "PLN" }` → a display string, best-effort. */
function formatPrice(amount?: string | number, currency?: string, fallback = ""): string {
  if (amount == null) return fallback;
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return fallback;
  if (n === 0) return "Free";
  const symbols: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", PLN: "zł" };
  const sym = currency ? symbols[currency] : "";
  // zł reads better as a suffix; symbols as a prefix.
  return currency === "PLN" ? `${n} zł` : sym ? `${sym}${n}` : `${n} ${currency ?? ""}`.trim();
}

function startFromEvent(ev: Record<string, unknown>): { day?: string; time?: string } {
  // Wix Events keeps the start moment in a couple of possible shapes depending
  // on version; probe them defensively and format to "Fri" / "21:00".
  const settings = (ev.dateAndTimeSettings ?? ev.scheduling) as Record<string, unknown> | undefined;
  const raw =
    (settings?.startDate as string | undefined) ??
    ((settings?.config as Record<string, unknown> | undefined)?.startDate as string | undefined);
  if (!raw) return {};
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return {};
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

/**
 * Overlay live Wix Events fields onto a demo room (matched by slug), keeping the
 * editorial extras (genre, mood, vinyl lineup, equipment, sleeve) that Wix Events
 * has no native home for. Anything we can't read confidently keeps its demo value.
 */
function mergeEvent(base: Room, ev: Record<string, unknown>, ticket?: Record<string, unknown>): Room {
  const { day, time } = startFromEvent(ev);
  const location = ev.location as Record<string, unknown> | undefined;
  const price = ticket?.price as Record<string, unknown> | undefined;
  const limits = ticket?.dashboard as Record<string, unknown> | undefined;
  const sold = typeof limits?.ticketsSold === "number" ? (limits.ticketsSold as number) : undefined;

  return {
    ...base,
    title: (ev.title as string) || base.title,
    wixEventId: ev._id as string,
    wixEventSlug: (ev.slug as string) || base.wixEventSlug,
    wixTicketDefinitionId: (ticket?._id as string) || base.wixTicketDefinitionId,
    day: day ?? base.day,
    time: time ?? base.time,
    city: (location?.name as string) || (location?.city as string) || base.city,
    price: formatPrice(price?.amount as string, price?.currency as string, base.price),
    seatsLeft: sold != null ? Math.max(0, base.capacity - sold) : base.seatsLeft,
    source: "wix",
  };
}

/**
 * Server-side. Returns live Wix Events mapped to rooms when the Headless client
 * is configured and returns events; otherwise the built-in demo set. Never
 * throws — any failure degrades to demo data so the page always renders.
 */
export async function getListeningRooms(): Promise<RoomsResult> {
  const client = getWixClient();
  if (!client) return { rooms: demoRooms, source: "mock" };

  try {
    const res = await client.wixEventsV2.queryEvents().limit(50).find();
    const events = (res.items ?? []) as Record<string, unknown>[];
    if (events.length === 0) return { rooms: demoRooms, source: "mock" };

    // Pull one on-sale ticket per event (for price + a ticketDefinitionId),
    // in parallel; tolerate individual failures.
    const withTickets = await Promise.all(
      events.map(async (ev) => {
        try {
          const avail = await client.orders.queryAvailableTickets({
            filter: { eventId: ev._id },
            limit: 1,
          });
          return { ev, ticket: avail.definitions?.[0] as Record<string, unknown> | undefined };
        } catch {
          return { ev, ticket: undefined };
        }
      }),
    );

    // Build rooms from live events, borrowing editorial extras from the demo room
    // that matches — by normalized title first (robust to Wix's auto-slugs), then
    // by slug; unmatched events fall back to a rotating demo sleeve.
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const byTitle = new Map(demoRooms.map((r) => [norm(r.title), r]));
    const bySlug = new Map(demoRooms.map((r) => [r.id, r]));
    const rooms: Room[] = withTickets.map(({ ev, ticket }, i) => {
      const slug = (ev.slug as string) ?? "";
      const title = (ev.title as string) ?? "";
      const base =
        byTitle.get(norm(title)) ??
        bySlug.get(slug) ??
        { ...demoRooms[i % demoRooms.length], id: slug || `event-${i}` };
      return mergeEvent(base, ev, ticket);
    });

    return { rooms, source: "wix" };
  } catch {
    return { rooms: demoRooms, source: "mock" };
  }
}
