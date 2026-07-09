"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import AlbumArt from "./AlbumArt";
import VinylDisc from "./VinylDisc";
import Waveform from "./Waveform";
import { useBooking } from "./booking/BookingProvider";
import { usePlayer, type Track } from "./player/PlayerProvider";
import { firstPlayable } from "@/lib/previews";
import { type Room } from "@/data/rooms";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2 5 5.3 5 7.3 5 8.8 6.2 12 9c3.2-2.8 4.7-4 6.7-4C22 5 23.6 8.4 22 11.8 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export default function RoomCard({ room, index = 0 }: { room: Room; index?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [saved, setSaved] = useState(false);
  const { open } = useBooking();
  const player = usePlayer();

  const hit = firstPlayable(room.records);
  const isThis = !!hit && player.current?.previewUrl === hit.preview.previewUrl;
  const isPlaying = isThis && player.playing;

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hit) return;
    const t: Track = {
      record: hit.record,
      track: hit.preview.track,
      artist: hit.preview.artist,
      previewUrl: hit.preview.previewUrl,
      artwork: hit.preview.artwork,
      roomTitle: room.title,
      city: room.city,
      accent: room.sleeve.accent,
    };
    player.toggle(t);
  };

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 150, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  const seatPct = Math.round((room.seatsLeft / room.capacity) * 100);
  const scarce = room.seatsLeft <= 3;

  return (
    <motion.article
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={reduce ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: "preserve-3d",
        boxShadow: isPlaying ? `0 0 0 1.5px ${room.sleeve.accent}, 0 20px 60px -20px ${room.sleeve.accent}66` : undefined,
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-gradient-to-b from-charcoal/60 to-pitch/80 p-4 transition-[border-color,box-shadow] duration-500 hover:border-amber/25 [perspective:1000px]"
    >
      {/* hover glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ boxShadow: "inset 0 0 60px rgba(216,154,69,0.08), 0 40px 80px -40px rgba(180,95,42,0.5)" }} />

      {/* artwork stage */}
      <div className="relative [transform:translateZ(40px)]" style={{ transformStyle: "preserve-3d" }}>
        <div className="relative aspect-square">
          {/* vinyl slides out on hover (and spins while previewing) */}
          <div className={`absolute right-0 top-0 aspect-square w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[22%] ${isPlaying ? "translate-x-[22%]" : "translate-x-0"}`}>
            <VinylDisc label={room.genre} accent={room.sleeve.accent} spinning={isPlaying} className="w-full" />
          </div>
          {/* sleeve */}
          <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-1 group-hover:-translate-x-[3%]">
            <AlbumArt sleeve={room.sleeve} className="shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]" />
          </div>

          {/* play preview overlay */}
          {hit && (
            <button
              type="button"
              aria-label={isPlaying ? `Pause preview: ${hit.preview.track}` : `Play preview: ${hit.preview.track} — ${hit.preview.artist}`}
              title={`Preview: ${hit.preview.track} — ${hit.preview.artist}`}
              onClick={togglePreview}
              className={`absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-void transition-all duration-300 clickable ${
                isThis ? "scale-105 opacity-100" : "scale-95 opacity-90 group-hover:scale-105 group-hover:opacity-100"
              }`}
              style={{
                background: "linear-gradient(135deg,#e8b45f,#b45f2a)",
                boxShadow: isPlaying
                  ? "0 0 0 6px rgba(216,154,69,0.18), 0 12px 34px -8px rgba(216,154,69,0.9)"
                  : "0 12px 34px -8px rgba(216,154,69,0.75)",
              }}
            >
              {isPlaying ? (
                <span className="flex gap-1"><i className="h-4 w-1 rounded-full bg-void" /><i className="h-4 w-1 rounded-full bg-void" /></span>
              ) : (
                <span className="ml-0.5">▶</span>
              )}
            </button>
          )}

          {/* now spinning / now playing badge — names the actual track so the
             preview's intent (and what's audible) is never ambiguous */}
          {(room.nowSpinning || isPlaying) && (
            <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-void/70 px-2.5 py-1 backdrop-blur-sm">
              <Waveform bars={3} className="h-2.5 w-3 shrink-0" color={room.sleeve.accent} playing={isPlaying || !!room.nowSpinning} />
              <span className="truncate text-[0.6rem] uppercase tracking-[0.16em] text-cream/80">
                {isPlaying ? `Playing · ${hit?.preview.track}` : "Now spinning"}
              </span>
            </div>
          )}

          {/* save button */}
          <button
            type="button"
            aria-label={saved ? "Saved" : "Save event"}
            aria-pressed={saved}
            onClick={() => setSaved((v) => !v)}
            className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-edge bg-void/60 backdrop-blur-sm transition-all duration-300 clickable ${
              saved ? "text-burnt" : "text-cream/70 hover:text-cream"
            }`}
          >
            <Heart filled={saved} />
          </button>
        </div>
      </div>

      {/* meta */}
      <div className="relative mt-4 flex flex-1 flex-col [transform:translateZ(24px)]">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-edge px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] text-beige">
            {room.genre}
          </span>
          <span className="text-[0.68rem] text-dust">{room.mood}</span>
        </div>

        <h3 className="mt-2 font-display text-2xl leading-tight text-cream">{room.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-parchment">{room.blurb}</p>

        {/* vinyl lineup preview */}
        <div className="mt-3 flex items-center gap-1.5">
          {room.records.slice(0, 3).map((r) => (
            <span key={r} className="h-5 w-5 rounded-full grooves ring-1 ring-edge" title={r} />
          ))}
          <span className="ml-1 text-[0.68rem] text-dust">
            {room.records.length} records in the crate
          </span>
        </div>

        {/* host + location */}
        <div className="mt-4 flex items-center gap-2 text-xs text-parchment">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[0.6rem] font-semibold text-void"
            style={{ background: `linear-gradient(135deg, ${room.sleeve.accent}, ${room.sleeve.from})` }}
          >
            {room.hostInitials}
          </span>
          <span className="text-cream/90">{room.host}</span>
          <span className="h-1 w-1 rounded-full bg-dust" />
          <span>{room.city}</span>
        </div>

        {/* seat availability bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[0.7rem]">
            <span className={scarce ? "text-amber" : "text-parchment"}>
              {room.seatsLeft} of {room.capacity} seats left
            </span>
            <span className="text-dust">{room.day} · {room.time}</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-edge">
            <motion.div
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${100 - seatPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: scarce ? "linear-gradient(90deg,#d89a45,#b45f2a)" : "linear-gradient(90deg,#bfae91,#c8a35a)" }}
            />
          </div>
        </div>

        {/* footer CTA */}
        <div className="mt-5 flex items-center justify-between border-t border-edge pt-4">
          <div>
            <div className="font-display text-xl text-cream">{room.price}</div>
            <div className="text-[0.62rem] uppercase tracking-[0.14em] text-dust">per seat</div>
          </div>
          <button
            type="button"
            onClick={() => open(room)}
            className="group/btn relative overflow-hidden rounded-full border border-edge-strong px-4 py-2 text-sm text-cream transition-colors duration-300 hover:border-amber/50 clickable"
          >
            <span className="relative z-10">Reserve a seat</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-amber/20 to-burnt/20 transition-transform duration-500 group-hover/btn:translate-x-0" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
