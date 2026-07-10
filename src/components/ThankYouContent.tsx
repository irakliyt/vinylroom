"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SpotlightBackground from "@/components/SpotlightBackground";
import NoiseOverlay from "@/components/NoiseOverlay";
import AlbumArt from "@/components/AlbumArt";
import MemberBookingNote from "@/components/MemberBookingNote";
import ScratchableVinyl from "@/components/ScratchableVinyl";
import { rooms as demoRooms } from "@/data/rooms";

const nextSteps = [
  { label: "Check your inbox", note: "Your ticket and the room address are on the way." },
  { label: "Add it to your calendar", note: "Arrive within 15 minutes of doors — late entry breaks the spell." },
  { label: "Bring one record", note: "Something you'd love the room to hear between sides." },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export default function ThankYouContent() {
  const [query, setQuery] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setQuery(new URLSearchParams(window.location.search));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const event = query?.get("event") ?? "";
  const orderRef =
    query?.get("orderNumber") ||
    query?.get("orderId") ||
    query?.get("reservationId") ||
    query?.get("ticketOrderId") ||
    "";

  // Wix appends an order/reservation identifier on a completed checkout. If
  // it's missing, the visitor likely bounced off checkout (declined card,
  // "unavailable" error, or just navigated back) — don't claim their seat is
  // saved when we have no evidence it is.
  const confirmed = !!(
    orderRef
  );

  // Resolve the booked room from the baked catalogue by id, slug, or title.
  const room = useMemo(
    () =>
      demoRooms.find((r) => r.id === event || r.wixEventSlug === event) ??
      demoRooms.find((r) => norm(r.title) === norm(event) || norm(event).includes(r.id.replace(/-/g, ""))) ??
      demoRooms[0],
    [event],
  );

  return (
    <>
      <SpotlightBackground />
      <NoiseOverlay />

      <main className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 py-20 text-center">
        <ScratchableVinyl accent={room.sleeve.accent} autoSpin={confirmed} label={room.genre} />

        {confirmed ? (
          <>
            <span className="eyebrow">Your seat is saved</span>
            <h1 className="mt-4 max-w-2xl text-balance font-display text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.98] text-cream">
              A chair is waiting for you in the dark.
            </h1>
            <p className="mt-5 max-w-md text-lg text-parchment">
              You&apos;re on the list for{" "}
              <span className="text-cream">{room.title}</span> — {room.day} · {room.time}, {room.city}.
            </p>
          </>
        ) : (
          <>
            <span className="eyebrow text-amber">Checkout wasn&apos;t confirmed</span>
            <h1 className="mt-4 max-w-2xl text-balance font-display text-[clamp(2.2rem,5.5vw,3.8rem)] leading-[0.98] text-cream">
              We didn&apos;t hear back from checkout.
            </h1>
            <p className="mt-5 max-w-md text-lg text-parchment">
              If you already paid, check your email for a confirmation — otherwise, your seat for{" "}
              <span className="text-cream">{room.title}</span> hasn&apos;t been reserved yet.
            </p>
          </>
        )}

        <MemberBookingNote />

        {/* saved pass */}
        <div className="relative mt-10 w-full max-w-xl overflow-hidden rounded-3xl border border-edge bg-gradient-to-br from-charcoal/80 via-pitch/90 to-void/90 p-4 text-left glow-warm sm:p-5">
          <div className="pointer-events-none absolute -right-24 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full grooves opacity-35" />
          <div className="relative grid gap-4 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center">
            <div className="relative h-24 w-24 shrink-0 sm:h-[5.5rem] sm:w-[5.5rem]">
              <div className="absolute left-8 top-2 h-20 w-20 rounded-full grooves opacity-80 ring-1 ring-edge" />
              <div className="relative h-20 w-20 overflow-hidden rounded-xl shadow-[0_18px_44px_-24px_rgba(0,0,0,0.95)]">
                <AlbumArt sleeve={room.sleeve} />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-edge bg-void/40 px-2.5 py-1 text-[0.56rem] uppercase tracking-[0.18em] text-amber">
                  {confirmed ? "Pass saved" : "Room preview"}
                </span>
                {orderRef && (
                  <span className="max-w-full truncate rounded-full border border-edge bg-void/40 px-2.5 py-1 text-[0.56rem] uppercase tracking-[0.14em] text-dust">
                    Order {orderRef}
                  </span>
                )}
              </div>
              <div className="mt-3 truncate font-display text-2xl leading-tight text-cream">{room.title}</div>
              <div className="mt-1 text-sm text-parchment">
                {room.venue} · {room.day} · {room.time}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-dust">
                {room.records.slice(0, 3).map((record) => (
                  <span key={record} className="rounded-full border border-edge bg-void/30 px-2.5 py-1">
                    {record}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* next steps */}
        <ol className={`mt-10 grid w-full max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-3 ${confirmed ? "" : "opacity-40"}`}>
          {nextSteps.map((s, i) => (
            <li key={s.label} className="rounded-2xl border border-edge bg-pitch/40 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-edge-strong text-xs text-amber">
                {i + 1}
              </span>
              <div className="mt-3 font-display text-lg leading-tight text-cream">{s.label}</div>
              <p className="mt-1 text-sm text-parchment">{s.note}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/#rooms"
            className="rounded-full px-7 py-3.5 text-sm font-medium text-void clickable"
            style={{ background: "linear-gradient(135deg,#e8b45f,#b45f2a)", boxShadow: "0 16px 40px -14px rgba(216,154,69,0.6)" }}
          >
            Explore more rooms
          </Link>
          <Link
            href="/"
            className="rounded-full border border-edge-strong px-7 py-3.5 text-sm text-cream transition-colors hover:border-amber/50 clickable"
          >
            Back home
          </Link>
        </div>
      </main>
    </>
  );
}
