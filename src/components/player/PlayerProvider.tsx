"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getPreview } from "@/lib/previews";

export type Track = {
  record: string;
  track: string;
  artist: string;
  previewUrl: string;
  artwork: string;
  roomTitle?: string;
  city?: string;
  accent?: string;
};

type PlayerCtx = {
  current: Track | null;
  playing: boolean;
  progress: number; // 0..1
  hasEverPlayed: boolean;
  toggle: (t: Track) => void;
  resume: () => void;
  stop: () => void;
  isCurrent: (previewUrl: string) => boolean;
};

const Ctx = createContext<PlayerCtx | null>(null);
const INTRO_KEY = "vlr:intro-played";

function getIntroTrack(): Track | null {
  const introPreview = getPreview("AC/DC — Thunderstruck");
  if (!introPreview) return null;
  return {
    record: "AC/DC — Thunderstruck",
    track: introPreview.track,
    artist: introPreview.artist,
    previewUrl: introPreview.previewUrl,
    artwork: introPreview.artwork,
    roomTitle: "Warming up the room",
    accent: "#e2a552",
  };
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be used within <PlayerProvider>");
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(() => getIntroTrack());
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);

  // One <audio> element, attached to the DOM (hidden) for reliable playback.
  // Deliberately NOT routed through Web Audio: Apple's preview CDN doesn't send
  // CORS headers, and piping a tainted media element through an AnalyserNode can
  // silence it. Reactive visuals use a synthetic pulse instead — sound first.
  useEffect(() => {
    const audio = document.createElement("audio");
    audio.preload = "none";
    audio.style.display = "none";
    document.body.appendChild(audio);
    audioRef.current = audio;

    const onTime = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    const onPlay = () => {
      setPlaying(true);
      setHasEverPlayed(true);
    };
    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    // ── Intro: greet the visitor with AC/DC — Thunderstruck, quietly. It's
    // always cued as `current` (so the sound toggle has something to control
    // even after a reload), but the AUTOPLAY ATTEMPT only fires once per
    // session — browsers block unmuted autoplay anyway, so on the first
    // rejection we arm a one-shot gesture starter instead of retrying forever.
    let cleanupIntro = () => {};
    const intro = getIntroTrack();
    if (intro) {
      audio.volume = 0.18; // never loud
      audio.src = intro.previewUrl;

      if (!sessionStorage.getItem(INTRO_KEY)) {
        const start = () => {
          sessionStorage.setItem(INTRO_KEY, "1");
          if (audio.currentSrc || audio.src) audio.play().catch(() => {});
        };
        // optimistic attempt (works where autoplay is permitted)
        audio.play().then(() => sessionStorage.setItem(INTRO_KEY, "1")).catch(() => {
          // blocked → arm a one-shot gesture starter
          window.addEventListener("pointerdown", start, { once: true });
          window.addEventListener("keydown", start, { once: true });
          cleanupIntro = () => {
            window.removeEventListener("pointerdown", start);
            window.removeEventListener("keydown", start);
          };
        });
      }
    }

    return () => {
      cleanupIntro();
      audio.pause();
      audio.remove();
    };
  }, []);

  const toggle = useCallback(
    (t: Track) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = 1; // user-initiated plays are full volume (intro was quiet)
      if (current?.previewUrl === t.previewUrl) {
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
        return;
      }
      setCurrent(t);
      setProgress(0);
      audio.src = t.previewUrl;
      audio.play().catch(() => {});
    },
    [current],
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  // For the sound-on toggle: play/pause whatever is cued, at full volume,
  // without needing a full Track object (covers the blocked-autoplay case).
  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.volume = 1;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [current]);

  const isCurrent = useCallback(
    (previewUrl: string) => current?.previewUrl === previewUrl && playing,
    [current, playing],
  );

  const value = useMemo<PlayerCtx>(
    () => ({ current, playing, progress, hasEverPlayed, toggle, resume, stop, isCurrent }),
    [current, playing, progress, hasEverPlayed, toggle, resume, stop, isCurrent],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
