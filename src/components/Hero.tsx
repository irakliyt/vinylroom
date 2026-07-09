"use client";

import { useRef } from "react";
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
import { featuredEvent, stats } from "@/data/rooms";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { open } = useBooking();

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
              <VinylDisc label="Kind of Blue" accent="#7fa8e8" spinning className="w-full" />
            </motion.div>

            {/* album sleeve in front */}
            <motion.div
              style={{ y: yCover, translateZ: 40, willChange: "transform" }}
              className="absolute left-[2%] top-0 w-[76%] rounded-[4px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.85)]"
            >
              <AlbumArt
                sleeve={featuredEvent.sleeve}
                label="Blue Note After Dark"
                sub="Jazz · Warsaw"
              />
            </motion.div>

            {/* floating booking card */}
            <motion.div
              style={{ y: yCard, translateZ: 90, willChange: "transform" }}
              className="absolute -bottom-2 -right-2 w-[64%] max-w-[15rem] rounded-2xl p-4 glass glow-warm"
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[0.6rem]">Now spinning</span>
                <Waveform bars={4} className="h-3 w-5" />
              </div>
              <div className="mt-2 font-display text-lg leading-tight text-cream">
                Blue Note After Dark
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-parchment">
                <span>Fri · 21:00</span>
                <span className="h-1 w-1 rounded-full bg-dust" />
                <span>Warsaw</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-edge pt-3">
                <div>
                  <div className="text-sm font-medium text-cream">$18</div>
                  <div className="text-[0.65rem] text-amber">3 of 8 seats left</div>
                </div>
                <button
                  type="button"
                  onClick={() => open(featuredEvent)}
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
