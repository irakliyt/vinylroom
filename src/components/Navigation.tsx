"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Waveform from "./Waveform";
import MemberMenu from "./member/MemberMenu";
import SoundToggle from "./SoundToggle";

const links = [
  { label: "Rooms", href: "#rooms" },
  { label: "How it works", href: "#how" },
  { label: "A night", href: "#event" },
  { label: "Host", href: "#host" },
  { label: "Community", href: "#community" },
];

export default function Navigation({
  source = "mock",
  roomCount = 6,
}: {
  source?: "wix" | "mock";
  roomCount?: number;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-500 ${
          scrolled || open ? "bg-void/90 backdrop-blur-xl" : ""
        }`}
      >
        <nav className="mx-auto flex max-w-[92rem] items-center justify-between border-b border-edge/60 px-5 py-4 sm:px-8 xl:grid xl:grid-cols-[12rem_minmax(0,1fr)_auto] xl:gap-6 2xl:grid-cols-[14rem_minmax(0,1fr)_auto] 2xl:gap-8">
          {/* wordmark */}
          <a href="#top" className="group flex shrink-0 items-center gap-2.5 sm:gap-3.5 clickable xl:justify-self-start">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 rounded-full grooves shadow-[inset_0_0_8px_rgba(0,0,0,0.9)]" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-amber shadow-[0_0_10px_rgba(216,154,69,0.8)]" />
            </span>
            <span className="flex flex-col gap-1 leading-none">
              <span className="font-display text-[1rem] leading-[0.95] tracking-tight text-cream sm:text-[1.05rem]">
                Vinyl Rooms
              </span>
              <span className="hidden text-[0.54rem] uppercase leading-none tracking-[0.32em] text-dust sm:block">
                Listening sessions
              </span>
            </span>
          </a>

          {/* desktop links */}
          <div className="hidden min-w-0 items-center justify-center gap-5 md:flex 2xl:gap-7">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative whitespace-nowrap text-sm text-parchment transition-colors hover:text-cream"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-amber transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2.5 md:gap-3 xl:justify-self-end">
            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-edge px-3 py-1.5 min-[1800px]:flex" title={source === "wix" ? "Live from Wix Events" : "Demo data — connect Wix to go live"}>
              <Waveform bars={4} className="h-3 w-4" color={source === "wix" ? "var(--color-amber)" : "var(--color-beige)"} />
              <span className="whitespace-nowrap text-[0.65rem] uppercase tracking-[0.2em] text-dust">
                {source === "wix" ? `${roomCount} rooms live` : "Demo mode"}
              </span>
            </div>
            <SoundToggle />
            <MemberMenu variant="bar" />
            <a
              href="#host"
              className="hidden shrink-0 whitespace-nowrap rounded-full bg-cream px-5 py-2 text-sm font-medium text-void transition-transform duration-300 hover:scale-[1.03] xl:inline-block clickable"
            >
              Host a night
            </a>
            {/* mobile toggle */}
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full border border-edge md:hidden clickable"
            >
              <span
                className={`h-px w-4 bg-cream transition-all ${open ? "translate-y-[3px] rotate-45" : ""}`}
              />
              <span
                className={`h-px w-4 bg-cream transition-all ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
              />
            </button>
          </div>
        </nav>
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-[4.5rem] overflow-y-auto border-b border-edge bg-void/98 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 pb-8 pt-7">
              <div className="border-t border-edge">
                {links.map((l, index) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-edge py-4 font-display text-[clamp(1.45rem,7vw,2rem)] leading-none text-cream"
                  >
                    <span>{l.label}</span>
                    <span className="text-sm text-amber/70">0{index + 1}</span>
                  </a>
                ))}
              </div>
              <div className="mt-10 border-t border-edge pt-6">
                <a
                  href="#host"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-cream py-3.5 text-center text-sm font-medium text-void"
                >
                  Host a night
                </a>
                <MemberMenu variant="drawer" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
