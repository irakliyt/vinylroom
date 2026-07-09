"use client";

import { usePlayer } from "./player/PlayerProvider";

/**
 * Persistent sound on/off control. Browsers block unmuted autoplay, so the
 * intro track is usually cued but silent until the first click — this button
 * makes turning sound on an obvious, one-tap action, and pulses until audio
 * has ever played this session so it doesn't get missed.
 */
export default function SoundToggle() {
  const { current, playing, hasEverPlayed, resume } = usePlayer();
  if (!current) return null;

  const label = playing ? "Turn sound off" : "Turn sound on";

  return (
    <button
      type="button"
      onClick={resume}
      aria-label={label}
      title={label}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge-strong text-cream transition-colors hover:border-amber/60 clickable"
    >
      {!hasEverPlayed && (
        <>
          <span className="absolute inset-0 rounded-full" style={{ animation: "ring-pulse 1.8s ease-out infinite" }} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber" />
        </>
      )}
      {playing ? (
        // speaker with sound waves
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a8 8 0 0 1 0 12" opacity="0.6" />
        </svg>
      ) : (
        // muted speaker
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
          <path d="M16 9l5 6M21 9l-5 6" />
        </svg>
      )}
    </button>
  );
}
