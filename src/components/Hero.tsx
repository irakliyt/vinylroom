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

const SCRATCH_SRC = "/audio/liecio-vinyl-effect-loop-110210.mp3";

function pointerAngle(e: React.PointerEvent<HTMLButtonElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  return Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2)) * (180 / Math.PI);
}

function angleDelta(next: number, prev: number) {
  let delta = next - prev;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

export default function Hero({ rooms }: { rooms?: Room[] }) {
  const ref = useRef<HTMLElement>(null);
  const scratchAudio = useRef<HTMLAudioElement | null>(null);
  const lastAngle = useRef(0);
  const lastAt = useRef(0);
  const djModeRef = useRef(false);
  const reduce = useReducedMotion();
  const { open } = useBooking();
  const player = usePlayer();
  const [djMode, setDjMode] = useState(false);
  const [scratching, setScratching] = useState(false);
  const [scratchRotation, setScratchRotation] = useState(0);

  // Prefer the live (Wix-merged) room so "Reserve" actually reaches real
  // checkout — the static `featuredEvent` import never has a wixEventId.
  const featured = rooms?.find((r) => r.id === featuredEvent.id) ?? featuredEvent;
  const activeTrack = player.current;
  const stageTitle = activeTrack ? activeTrack.track : featured.title;
  const stageSubtitle = activeTrack
    ? `${activeTrack.artist}${activeTrack.roomTitle ? ` · ${activeTrack.roomTitle}` : ""}`
    : `${featured.day} · ${featured.time}`;
  const stageLocation = activeTrack?.city ?? featured.city;
  const stageAccent = activeTrack?.accent ?? featured.sleeve.accent;
  const stageLabel = activeTrack ? "Now playing" : "Now spinning";

  useEffect(() => {
    djModeRef.current = djMode;
    if (!djMode) return;
    const audio = scratchAudio.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0.65;
    audio.playbackRate = 1;
    audio.play().catch(() => {});
  }, [djMode]);

  const toggleDjMode = async () => {
    const next = !djMode;
    djModeRef.current = next;
    setDjMode(next);
    const audio = scratchAudio.current;
    if (!audio) return;
    if (next) {
      audio.loop = true;
      audio.volume = 0.65;
      audio.playbackRate = 1;
      await audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = 1;
    }
  };

  const startScratch = async (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    djModeRef.current = true;
    setDjMode(true);
    setScratching(true);
    lastAngle.current = pointerAngle(e);
    lastAt.current = performance.now();
    const audio = scratchAudio.current;
    if (audio) {
      audio.loop = true;
      audio.volume = 0.72;
      await audio.play().catch(() => {});
    }
  };

  const moveScratch = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!scratching) return;
    const next = pointerAngle(e);
    const now = performance.now();
    const delta = angleDelta(next, lastAngle.current);
    const speed = Math.min(Math.abs(delta) / Math.max(now - lastAt.current, 16), 1.7);
    setScratchRotation((r) => r + delta);
    lastAngle.current = next;
    lastAt.current = now;

    const audio = scratchAudio.current;
    if (audio) {
      audio.volume = Math.min(0.35 + speed * 0.6, 0.95);
      audio.playbackRate = Math.min(0.7 + speed * 1.7, 2);
      if (audio.paused) audio.play().catch(() => {});
    }
  };

  const stopScratch = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setScratching(false);
    const audio = scratchAudio.current;
    if (audio && !djModeRef.current) {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = 1;
    }
  };

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yVinyl = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160]);
  const yCover = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60]);
  const yCard = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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
      <div className="mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-32 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-28">
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
          className="relative flex items-center justify-center [perspective:1400px]"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          <motion.div
            style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", willChange: "transform" }}
            className="relative aspect-square w-full max-w-[26rem]"
          >
            {/* warm halo */}
            <div className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(226,165,82,0.3),transparent_60%)] blur-2xl" />

            {/* vinyl sliding out behind the sleeve */}
            <motion.div
              style={{ y: yVinyl, translateZ: -40, willChange: "transform" }}
              className="absolute right-[-14%] top-[8%] w-[82%]"
            >
              <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(244,232,208,0.2),transparent_65%)] blur-xl" />
              <button
                type="button"
                aria-label="DJ scratch the hero record"
                aria-pressed={djMode}
                onPointerDown={startScratch}
                onPointerMove={moveScratch}
                onPointerUp={stopScratch}
                onPointerCancel={stopScratch}
                className="relative block w-full touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber/80 clickable"
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
              </button>
            </motion.div>

            {/* album sleeve in front */}
            <motion.div
              style={{ y: yCover, translateZ: 40, willChange: "transform" }}
              className="absolute left-[2%] top-0 w-[76%] rounded-[4px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.85)]"
            >
              {activeTrack?.artwork ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-[3px] bg-charcoal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeTrack.artwork} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/85 to-transparent p-[7%]">
                    <div className="font-display text-[clamp(0.7rem,1.6vw,1rem)] leading-tight text-cream">
                      {activeTrack.record}
                    </div>
                    <div className="mt-0.5 text-[0.6rem] uppercase tracking-[0.22em] text-cream/60">
                      {activeTrack.artist}
                    </div>
                  </div>
                </div>
              ) : (
                <AlbumArt
                  sleeve={featured.sleeve}
                  label={featured.title}
                  sub={`${featured.genre} · ${featured.city}`}
                />
              )}
            </motion.div>

            <div className="absolute right-[-18%] top-[3%] z-30 flex items-center gap-2 rounded-full border border-amber/55 bg-void/90 px-2 py-1.5 shadow-[0_0_38px_-8px_rgba(216,154,69,1)] backdrop-blur-md">
              <button
                type="button"
                onClick={toggleDjMode}
                className={`rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] transition-colors clickable ${
                  djMode ? "bg-amber text-void" : "text-amber hover:bg-amber/10"
                }`}
              >
                DJ mode
              </button>
              <span className="hidden whitespace-nowrap pr-2 text-[0.65rem] text-parchment sm:inline">
                {scratching ? "Scratching" : djMode ? "Sound on" : "Drag vinyl"}
              </span>
            </div>

            {/* floating booking card */}
            <motion.div
              style={{ y: yCard, translateZ: 90, willChange: "transform" }}
              className="absolute -bottom-2 -right-2 w-[64%] max-w-[15rem] rounded-2xl p-4 glass glow-warm"
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[0.6rem]">{stageLabel}</span>
                <Waveform bars={4} className="h-3 w-5" color={stageAccent} playing={player.playing} />
              </div>
              <div className="mt-2 font-display text-lg leading-tight text-cream">
                {stageTitle}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-parchment">
                <span className="truncate">{stageSubtitle}</span>
                <span className="h-1 w-1 rounded-full bg-dust" />
                <span>{stageLocation}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-edge pt-3">
                <div>
                  <div className="text-sm font-medium text-cream">{featured.price}</div>
                  <div className="text-[0.65rem] text-amber">{featured.seatsLeft} of {featured.capacity} seats left</div>
                </div>
                <button
                  type="button"
                  onClick={() => open(featured)}
                  className="rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-void transition-transform hover:scale-105 clickable"
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
