"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RoomCard from "./RoomCard";
import Reveal from "./Reveal";
import { GENRES, rooms as demoRooms, type Genre, type Room } from "@/data/rooms";

export default function FeaturedRooms({
  rooms = demoRooms,
  source = "mock",
}: {
  rooms?: Room[];
  source?: "wix" | "mock";
}) {
  const [active, setActive] = useState<Genre | "All">("All");

  const filtered = useMemo(
    () => (active === "All" ? rooms : rooms.filter((r) => r.genre === active)),
    [active, rooms],
  );

  return (
    <section id="rooms" className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
      <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="eyebrow">Featured listening rooms</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.16em] ${
                source === "wix"
                  ? "border-amber/40 text-amber"
                  : "border-edge text-dust"
              }`}
              title={
                source === "wix"
                  ? "Rooms are loaded live from Wix Events"
                  : "Showing built-in demo data — connect Wix to go live"
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${source === "wix" ? "animate-pulse bg-amber" : "bg-dust"}`}
              />
              {source === "wix" ? "Live from Wix" : "Demo data"}
            </span>
          </div>
          <h2 className="mt-4 text-balance font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.98] text-cream">
            Small rooms. Deep cuts. <span className="italic text-beige">Real conversation.</span>
          </h2>
          <p className="mt-4 max-w-md text-parchment">
            Every night is built around a real vinyl lineup and a handful of seats.
            Find the one that sounds like your kind of evening.
          </p>
        </div>
      </Reveal>

      {/* genre pills */}
      <Reveal delay={0.1} className="no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-2">
        {GENRES.map((g) => {
          const on = active === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setActive(g)}
              className={`relative shrink-0 rounded-full border px-4 py-2 text-sm transition-colors duration-300 clickable ${
                on ? "border-transparent text-void" : "border-edge text-parchment hover:border-edge-strong hover:text-cream"
              }`}
            >
              {on && (
                <motion.span
                  layoutId="pill"
                  className="absolute inset-0 rounded-full bg-cream"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{g}</span>
            </button>
          );
        })}
      </Reveal>

      {/* grid */}
      <motion.div layout className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((room, i) => (
            <motion.div
              key={room.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <RoomCard room={room} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
