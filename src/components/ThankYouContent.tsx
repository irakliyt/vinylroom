"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SpotlightBackground from "@/components/SpotlightBackground";
import NoiseOverlay from "@/components/NoiseOverlay";
import VinylDisc from "@/components/VinylDisc";
import AlbumArt from "@/components/AlbumArt";
import MemberBookingNote from "@/components/MemberBookingNote";
import { rooms as demoRooms } from "@/data/rooms";

const nextSteps = [
  { label: "Check your inbox", note: "Your ticket and the room address are on the way." },
  { label: "Add it to your calendar", note: "Arrive within 15 minutes of doors — late entry breaks the spell." },
  { label: "Bring one record", note: "Something you'd love the room to hear between sides." },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export default function ThankYouContent() {
  const params = useSearchParams();
  const event = params.get("event") ?? "";

  // Wix appends an order/reservation identifier on a completed checkout. If
  // it's missing, the visitor likely bounced off checkout (declined card,
  // "unavailable" error, or just navigated back) — don't claim their seat is
  // saved when we have no evidence it is.
  const confirmed = !!(params.get("orderId") || params.get("reservationId") || params.get("ticketOrderId"));

  // Resolve the booked room from the baked catalogue by id, slug, or title.
  const room =
    demoRooms.find((r) => r.id === event || r.wixEventSlug === event) ??
    demoRooms.find((r) => norm(r.title) === norm(event) || norm(event).includes(r.id.replace(/-/g, ""))) ??
    demoRooms[0];

  return (
    <>
      <SpotlightBackground />
      <NoiseOverlay />

      <main className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 py-20 text-center">
        {/* spinning disc crest */}
        <div className="relative mb-8 h-28 w-28">
          <div className="absolute inset-[-30%] rounded-full bg-[radial-gradient(circle,rgba(216,154,69,0.25),transparent_60%)] blur-2xl" />
          <VinylDisc accent={room.sleeve.accent} spinning={confirmed} label={room.genre} className="h-full w-full" />
        </div>

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

        {/* event card */}
        <div className="mt-10 flex w-full max-w-md items-center gap-4 rounded-2xl border border-edge bg-gradient-to-b from-charcoal/60 to-pitch/80 p-4 text-left glow-warm">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            <AlbumArt sleeve={room.sleeve} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.6rem] uppercase tracking-[0.2em] text-dust">
              {room.genre} · {room.mood}
            </div>
            <div className="truncate font-display text-xl leading-tight text-cream">{room.title}</div>
            <div className="text-xs text-parchment">
              {room.venue} · {room.day} · {room.time}
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
