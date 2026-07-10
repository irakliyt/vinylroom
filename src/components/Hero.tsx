"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import AlbumArt from "./AlbumArt";
import VinylDisc from "./VinylDisc";
import Waveform from "./Waveform";
import MagneticButton from "./MagneticButton";
import { useBooking } from "./booking/BookingProvider";
import { usePlayer } from "./player/PlayerProvider";
import { featuredEvent, stats, type Room } from "@/data/rooms";

const SCRATCH_SRC = "/audio/freesound_community-babyscratch-87371.mp3";

export default function Hero({ rooms }: { rooms?: Room[] }) {
  const ref = useRef<HTMLElement>(null);
  const scratchAudio = useRef<HTMLAudioElement | null>(null);
  const lastPointerY = useRef(0);
  const lastAt = useRef(0);
  const djModeRef = useRef(false);
  const scratchingRef = useRef(false);
  const scratchCleanup = useRef<(() => void) | null>(null);
  const reduce = useReducedMotion();
  const { open } = useBooking();
  const player = usePlayer();
  const [djMode, setDjMode] = useState(false);
  const [scratching, setScratching] = useState(false);
  const [scratchRotation, setScratchRotation] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  // Prefer the live (Wix-merged) room so "Reserve" actually reaches real
  // checkout — the static `featuredEvent` import never has a wixEventId.
  const featured = rooms?.find((r) => r.id === featuredEvent.id) ?? featuredEvent;
  const activeTrack = player.current;
  const stageTitle = activeTrack ? activeTrack.track : featured.title;
  const stageSubtitle = activeTrack ? activeTrack.artist : `${featured.day} · ${featured.time}`;
  const stageLocation = activeTrack?.city ?? featured.city;
  const stageAccent = activeTrack?.accent ?? featured.sleeve.accent;
  const stageLabel = activeTrack ? "Now playing" : "Now spinning";

  useEffect(() => {
    djModeRef.current = djMode;
  }, [djMode]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => () => scratchCleanup.current?.(), []);

  const toggleDjMode = () => {
    const next = !djMode;
    djModeRef.current = next;
    setDjMode(next);
    const audio = scratchAudio.current;
    if (!audio) return;
    if (!next) {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = 1;
    }
  };

  const scratchAt = (clientY: number) => {
    if (!scratchingRef.current) return;
    const now = performance.now();
    const distance = clientY - lastPointerY.current;
    const speed = Math.min((Math.abs(distance) / Math.max(now - lastAt.current, 16)) * 1.5, 1.7);
    setScratchRotation((r) => r + distance * 1.8);
    lastPointerY.current = clientY;
    lastAt.current = now;

    const audio = scratchAudio.current;
    if (audio) {
      audio.loop = true;
      audio.volume = Math.min(0.35 + speed * 0.6, 0.95);
      audio.playbackRate = Math.min(0.7 + speed * 1.7, 2);
      if (audio.paused) audio.play().catch(() => {});
    }
  };

  const stopScratch = () => {
    scratchingRef.current = false;
    scratchCleanup.current?.();
    scratchCleanup.current = null;
    setScratching(false);
    const audio = scratchAudio.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = 1;
    }
  };

  const startScratch = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safari can reject pointer capture during a rapid touch transition.
    }
    djModeRef.current = true;
    scratchingRef.current = true;
    setDjMode(true);
    setScratching(true);
    lastPointerY.current = e.clientY;
    lastAt.current = performance.now();

    const pointerId = e.pointerId;
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      scratchAt(event.clientY);
    };
    const onEnd = (event: PointerEvent) => {
      if (event.pointerId === pointerId) stopScratch();
    };
    scratchCleanup.current?.();
    scratchCleanup.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);

    const audio = scratchAudio.current;
    if (audio) {
      audio.loop = true;
      audio.volume = 0.35;
      audio.playbackRate = 1;
      audio.play().catch(() => {});
    }
  };

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yVinyl = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160]);
  const yCover = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60]);
  const yCard = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -24]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const stageScale = useTransform(scrollYProgress, [0, 0.75, 1], [1, reduce ? 1 : 0.96, reduce ? 1 : 0.92]);
  const cueArmRotate = useTransform(scrollYProgress, [0, 0.75, 1], [-8, reduce ? -8 : 4, reduce ? -8 : 8]);
  const cueArmY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 38]);
  const signalOpacity = useTransform(scrollYProgress, [0, 0.2, 0.85], [0.45, 1, 0.2]);

  // mouse-driven depth tilt for the whole stage
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section ref={ref} id="top" className="relative min-h-[100svh] overflow-hidden">
      <audio ref={scratchAudio} preload="auto" src={SCRATCH_SRC} />
      <div className="mx-auto grid min-h-[100svh] max-w-[100rem] grid-cols-1 items-center gap-12 px-5 pb-16 pt-32 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6 lg:pt-28">
        {/* ── Copy ── */}
        <motion.div style={{ opacity }} className="relative z-10 max-w-xl">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-edge bg-pitch/40 px-3 py-1.5 backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
            <span className="text-[0.65rem] uppercase tracking-[0.28em] text-beige">
              A room. A record. People who listen.
            </span>
          </motion.div>

          <h1 className="text-balance font-display text-[clamp(2.7rem,6.5vw,5.2rem)] leading-[0.95] text-cream">
            Host unforgettable{" "}
            <span className="relative inline-block italic">
              nights
              <span className="absolute -bottom-1 left-0 h-px w-full bg-gradient-to-r from-amber/70 to-transparent" />
            </span>{" "}
            around the records you love.
          </h1>

          <p className="mt-7 max-w-md text-lg leading-relaxed text-parchment">
            Create intimate vinyl listening sessions, invite real music lovers, and
            turn your collection into a shared evening.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <MagneticButton href="#host">Create a listening room →</MagneticButton>
            <MagneticButton href="#rooms" variant="ghost">
              Explore upcoming nights
            </MagneticButton>
          </div>

          {/* trust strip */}
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-edge pt-6">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl text-cream">{s.value}</div>
                <div className="text-[0.7rem] uppercase tracking-[0.18em] text-dust">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Visual stage ── */}
        <div
          className="relative flex items-center justify-center pb-60 sm:pb-0 lg:-translate-x-8 lg:pb-32 [perspective:1400px]"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          <motion.div
            style={{
              rotateX: rx,
              rotateY: ry,
              scale: stageScale,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
            className="relative aspect-[0.92] w-full max-w-[26rem] sm:aspect-square lg:max-w-[34rem]"
          >
            {/* warm halo */}
            <div className="pointer-events-none absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(226,165,82,0.3),transparent_60%)] blur-2xl" />

            {/* The scene's quiet technical layer gives the record a sense of place. */}
            <motion.div
              style={{ opacity: signalOpacity, translateZ: 10 }}
              className="pointer-events-none absolute -left-[13%] top-[18%] hidden w-[8.75rem] text-[0.55rem] uppercase tracking-[0.22em] text-beige/75 lg:block"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_10px_rgba(226,165,82,0.9)]" />
                <span>Side A / 33 1/3</span>
              </div>
              <div className="mt-3 h-px w-full bg-edge" />
              <div className="mt-2 flex items-center justify-between font-mono text-[0.48rem] tracking-[0.12em] text-dust/65">
                <span>ROOM 08</span>
                <span>LIVE</span>
              </div>
            </motion.div>

            <motion.div
              style={{ opacity: signalOpacity, translateZ: 20 }}
              className="pointer-events-none absolute -right-[12%] bottom-[18%] hidden w-[9.5rem] lg:block"
            >
              <div className="flex items-end gap-3 border-b border-edge pb-2">
                <Waveform bars={8} className="h-4 w-10" color="var(--color-amber)" playing={!reduce} />
                <span className="pb-0.5 text-[0.5rem] uppercase tracking-[0.22em] text-beige/70">Listening signal</span>
              </div>
              <p className="mt-2 font-mono text-[0.48rem] uppercase tracking-[0.12em] text-dust/55">
                Needle down / room tone
              </p>
            </motion.div>

            {/* A small cue arm makes the stage read as a turntable, not a floating card. */}
            <motion.div
              style={{ rotate: cueArmRotate, y: cueArmY, translateZ: 60 }}
              className="pointer-events-none absolute right-[-6%] top-[5%] z-20 hidden h-[42%] w-[20%] origin-[88%_8%] lg:block"
            >
              <div className="absolute right-[10%] top-[7%] h-[5px] w-[5px] rounded-full bg-cream shadow-[0_0_12px_rgba(248,240,221,0.65)]" />
              <div className="absolute right-[11%] top-[9%] h-[2px] w-[84%] origin-right rotate-[128deg] bg-gradient-to-l from-cream/90 via-beige/60 to-transparent shadow-[0_1px_4px_rgba(0,0,0,0.8)]" />
              <div className="absolute bottom-[8%] left-[1%] h-4 w-7 -rotate-[38deg] rounded-sm border border-beige/50 bg-pitch/90 shadow-[0_5px_12px_rgba(0,0,0,0.45)]" />
              <div className="absolute bottom-[4%] left-[-2%] h-2 w-2 rounded-full bg-amber shadow-[0_0_16px_rgba(226,165,82,0.9)]" />
            </motion.div>

            <div className="pointer-events-none absolute left-[20%] top-[14%] hidden h-1.5 w-1.5 animate-pulse rounded-full bg-cream/70 shadow-[0_0_12px_rgba(248,240,221,0.75)] lg:block" />
            <div className="pointer-events-none absolute bottom-[31%] left-[9%] hidden h-px w-[18%] bg-amber/35 lg:block" />

            {/* vinyl sliding out behind the sleeve */}
            <motion.div
              style={{ y: isDesktop ? yVinyl : 0, translateZ: -40, willChange: "transform" }}
              className="absolute right-[-3%] top-[12%] w-[70%] sm:right-[-7%] sm:top-[11%] sm:w-[76%]"
            >
              <div className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(244,232,208,0.2),transparent_65%)] blur-xl" />
              <div
                aria-hidden="true"
                className="pointer-events-none relative block w-full rounded-full"
                style={{
                  transform: `rotate(${scratchRotation}deg)`,
                  animation: !scratching ? "spin-slow 6s linear infinite" : undefined,
                }}
              >
                <VinylDisc label={activeTrack ? activeTrack.track : "Kind of Blue"} accent={stageAccent} spinning={false} className="w-full" />
                <span
                  className={`pointer-events-none absolute inset-[-5%] rounded-full border transition-opacity ${djMode ? "opacity-100" : "opacity-0"}`}
                  style={{ borderColor: stageAccent, boxShadow: `0 0 36px -8px ${stageAccent}` }}
                />
              </div>
            </motion.div>

            {/* album sleeve in front */}
            <motion.div
              style={{ y: isDesktop ? yCover : 0, translateZ: 40, willChange: "transform" }}
              className="pointer-events-none absolute left-[5%] top-[3%] w-[65%] rounded-[4px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.85)] sm:left-[3%] sm:top-[2%] sm:w-[70%]"
            >
              {activeTrack?.artwork ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-[3px] bg-charcoal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeTrack.artwork} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <AlbumArt
                  sleeve={featured.sleeve}
                  label={featured.title}
                  sub={`${featured.genre} · ${featured.city}`}
                />
              )}
            </motion.div>

            <button
              type="button"
              aria-label="DJ scratch the hero record"
              aria-pressed={scratching}
              onPointerDown={startScratch}
              onPointerUp={stopScratch}
              onPointerCancel={stopScratch}
              className="absolute right-[-4%] top-[9%] z-20 h-[67%] w-[51%] touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber/80 clickable sm:right-[0%] sm:top-[23%] sm:h-[42%] sm:w-[36%]"
            >
              <span className="sr-only">Drag the vinyl to scratch</span>
            </button>

            <div className="absolute left-[5%] top-[78%] z-30 flex items-center gap-1.5 rounded-full border border-amber/50 bg-void/90 px-1.5 py-1.5 shadow-[0_0_34px_-12px_rgba(216,154,69,1)] backdrop-blur-md sm:left-auto sm:right-[-14%] sm:top-[13%]">
              <button
                type="button"
                onClick={toggleDjMode}
                className={`rounded-full px-3.5 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] transition-colors clickable ${
                  djMode ? "bg-amber text-void" : "text-amber hover:bg-amber/10"
                }`}
              >
                DJ mode
              </button>
              <span className="hidden whitespace-nowrap pr-2 text-[0.6rem] text-parchment md:inline">
                {scratching ? "Scratching" : "Drag vinyl"}
              </span>
            </div>

            {/* floating booking card */}
            <motion.div
              style={{ y: isDesktop ? yCard : 0, translateZ: 90, willChange: "transform" }}
              className="absolute left-[5%] top-[97%] w-[90%] max-w-none rounded-2xl p-4 glass glow-warm sm:left-auto sm:bottom-[-9%] sm:right-[1%] sm:top-auto sm:w-[60%] sm:max-w-[14.75rem] lg:bottom-[-14%] lg:right-[38%] lg:w-[55%]"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="eyebrow text-[0.6rem]">{stageLabel}</span>
                <Waveform bars={4} className="h-3 w-5" color={stageAccent} playing={player.playing} />
              </div>
              <div className="mt-3 truncate font-display text-[1.05rem] leading-tight text-cream">
                {stageTitle}
              </div>
              <div className="mt-2 space-y-1 text-[0.72rem] leading-snug text-parchment">
                <div className="truncate">{stageSubtitle}</div>
                <div className="flex items-center gap-2 text-dust">
                  <span className="h-1 w-1 rounded-full bg-dust" />
                  <span className="truncate">{stageLocation}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-edge pt-3">
                <div>
                  <div className="text-sm font-medium text-cream">{featured.price}</div>
                  <div className="mt-0.5 text-[0.65rem] leading-none text-amber">
                    {featured.seatsLeft} of {featured.capacity} seats left
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => open(featured)}
                  className="shrink-0 rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-void transition-transform hover:scale-105 clickable"
                >
                  Reserve
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        style={{ opacity }}
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
      >
        <span className="text-[0.6rem] uppercase tracking-[0.3em] text-dust">Scroll</span>
        <div className="h-10 w-px bg-gradient-to-b from-beige/60 to-transparent" />
      </motion.div>
    </section>
  );
}
