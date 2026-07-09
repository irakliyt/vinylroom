"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AlbumArt from "./AlbumArt";
import Waveform from "./Waveform";
import Reveal from "./Reveal";
import { usePlayer, type Track } from "./player/PlayerProvider";
import { type Genre, type Sleeve } from "@/data/rooms";
import previewsData from "@/data/previews.json";

type Preview = { track: string; artist: string; previewUrl: string; artwork: string };
type HostDraft = {
  id: string;
  title: string;
  genre: Genre;
  moods: string[];
  capacity: number;
  price: number;
  isPrivate: boolean;
  records: string[];
  createdAt: string;
};

// Searchable album pool built from the real (iTunes-backed) catalogue.
const ALBUM_POOL = Object.entries(previewsData as Record<string, Preview>)
  .filter(([record]) => record !== "AC/DC — Thunderstruck")
  .map(([record, info]) => ({
    record,
    artist: info.artist,
    album: record.split(" — ").slice(1).join(" — "),
    artwork: info.artwork,
  }));

const GENRE_OPTS: { g: Genre; sleeve: Sleeve }[] = [
  { g: "Jazz", sleeve: { from: "#1b3a5c", to: "#0a1420", accent: "#7fa8e8", motif: "circle" } },
  { g: "Soul", sleeve: { from: "#7a1f2b", to: "#22070a", accent: "#e8a04a", motif: "split" } },
  { g: "Hip-Hop", sleeve: { from: "#c25a1e", to: "#2a1006", accent: "#f0a850", motif: "grid" } },
  { g: "Ambient", sleeve: { from: "#2f6b52", to: "#0a1712", accent: "#8fd6a8", motif: "horizon" } },
  { g: "City Pop", sleeve: { from: "#d4507e", to: "#2a0a1c", accent: "#ff9ec4", motif: "arc" } },
  { g: "Electronic", sleeve: { from: "#c22b3a", to: "#1a1a1c", accent: "#ff6b78", motif: "bars" } },
];

const MOODS = ["Warm", "Slow", "Intimate", "Loud", "Weightless", "Romantic", "Nocturnal"];
const HOST_DRAFTS_KEY = "vinylroom:host-drafts";

export default function CreateRoomPreview() {
  const [title, setTitle] = useState("Late Night on the Blue Side");
  const [genreIdx, setGenreIdx] = useState(0);
  const [moods, setMoods] = useState<string[]>(["Warm", "Slow", "Intimate"]);
  const [capacity, setCapacity] = useState(8);
  const [price, setPrice] = useState(18);
  const [isPrivate, setIsPrivate] = useState(false);
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<string[]>([
    "Miles Davis — Kind of Blue",
    "Bill Evans Trio — Waltz for Debby",
  ]);
  const [justOpened, setJustOpened] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [lastDraft, setLastDraft] = useState<HostDraft | null>(null);
  const player = usePlayer();

  const genre = GENRE_OPTS[genreIdx];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q ? ALBUM_POOL.filter((a) => a.record.toLowerCase().includes(q)) : ALBUM_POOL;
    // selected first, then the rest
    return [...pool].sort(
      (a, b) => Number(records.includes(b.record)) - Number(records.includes(a.record)),
    );
  }, [query, records]);
  const art = (record: string) => ALBUM_POOL.find((a) => a.record === record)?.artwork;
  const firstPlayable = ALBUM_POOL.find((a) => records.includes(a.record));
  const previewIsThis = !!firstPlayable && player.current?.record === firstPlayable.record;
  const previewIsPlaying = previewIsThis && player.playing;

  const playCratePreview = () => {
    if (!firstPlayable) return;
    const t: Track = {
      record: firstPlayable.record,
      track: firstPlayable.record.split(" — ").slice(1).join(" — "),
      artist: firstPlayable.artist,
      previewUrl: (previewsData as Record<string, { previewUrl: string }>)[firstPlayable.record]?.previewUrl ?? "",
      artwork: firstPlayable.artwork,
      roomTitle: title || "Your night",
      accent: genre.sleeve.accent,
    };
    if (!t.previewUrl) return;
    player.toggle(t);
  };

  const toggleMood = (m: string) =>
    setMoods((p) => (p.includes(m) ? p.filter((x) => x !== m) : p.length < 3 ? [...p, m] : p));
  const toggleRecord = (r: string) =>
    setRecords((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));

  const moodLine = useMemo(() => moods.join(" · ") || "Set a mood", [moods]);
  const draftSummary = (draft: HostDraft) => [
    `Event title: ${draft.title}`,
    `Genre: ${draft.genre}`,
    `Mood: ${draft.moods.join(", ") || "Not set"}`,
    `Capacity: ${draft.capacity}`,
    `Seat price: ${draft.price === 0 ? "Free" : `$${draft.price}`}`,
    `Visibility: ${draft.isPrivate ? "Private" : "Public"}`,
    "",
    "Crate:",
    ...draft.records.map((record) => `- ${record}`),
  ].join("\n");

  const saveDraft = () => {
    const draft: HostDraft = {
      id: `room-${Date.now()}`,
      title: title.trim() || "Untitled listening room",
      genre: genre.g,
      moods,
      capacity,
      price,
      isPrivate,
      records,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem(HOST_DRAFTS_KEY) ?? "[]") as HostDraft[];
      localStorage.setItem(HOST_DRAFTS_KEY, JSON.stringify([draft, ...existing].slice(0, 12)));
      setLastDraft(draft);
      setJustOpened(true);
      setDraftMessage("Draft saved on this device.");
      setTimeout(() => setJustOpened(false), 2800);
    } catch {
      setLastDraft(draft);
      setJustOpened(true);
      setDraftMessage("Draft prepared. Copy it before leaving this page.");
    }
  };

  const copyDraft = async () => {
    if (!lastDraft) return;
    try {
      await navigator.clipboard.writeText(draftSummary(lastDraft));
      setDraftMessage("Draft copied. Paste it into your Wix Events setup.");
    } catch {
      setDraftMessage("Could not copy automatically. Select the draft details and copy them.");
    }
  };

  return (
    <section id="host" className="relative z-10 border-y border-edge bg-pitch/40">
      <div className="mx-auto max-w-[100rem] px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="max-w-xl">
          <span className="eyebrow">Host mode</span>
          <h2 className="mt-4 text-balance font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.98] text-cream">
            Turn your collection <span className="italic text-beige">into an evening.</span>
          </h2>
          <p className="mt-4 text-parchment">
            Build the room the way you&apos;d build a mix. Everything you set appears,
            live, in the card your guests will see.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* ── Creator form ── */}
          <Reveal className="rounded-3xl border border-edge glass p-6 sm:p-8">
            {/* title */}
            <label className="block">
              <span className="eyebrow text-[0.62rem]">Event title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name your night"
                className="mt-2 w-full border-b border-edge-strong bg-transparent pb-2 font-display text-2xl text-cream outline-none transition-colors placeholder:text-dust focus:border-amber"
              />
            </label>

            {/* genre pills */}
            <div className="mt-8">
              <span className="eyebrow text-[0.62rem]">Genre</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {GENRE_OPTS.map((o, i) => (
                  <button
                    key={o.g}
                    type="button"
                    onClick={() => setGenreIdx(i)}
                    className={`relative rounded-full border px-4 py-2 text-sm transition-colors duration-300 clickable ${
                      genreIdx === i ? "border-transparent text-void" : "border-edge text-parchment hover:text-cream"
                    }`}
                  >
                    {genreIdx === i && (
                      <motion.span layoutId="genrePill" className="absolute inset-0 rounded-full" style={{ background: o.sleeve.accent }} transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    <span className="relative z-10">{o.g}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* mood pills (max 3) */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[0.62rem]">Mood · pick up to 3</span>
                <span className="text-[0.62rem] text-dust">{moods.length}/3</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const on = moods.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMood(m)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-all duration-300 clickable ${
                        on ? "border-amber/60 bg-amber/15 text-cream" : "border-edge text-parchment hover:text-cream"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* capacity + price sliders */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-[0.62rem]">Capacity</span>
                  <span className="font-display text-xl text-cream">{capacity}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={24}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="range mt-3 w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-[0.62rem]">Seat price</span>
                  <span className="font-display text-xl text-cream">${price}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={5}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="range mt-3 w-full"
                />
              </div>
            </div>

            {/* album search — real catalogue */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[0.62rem]">Add to the crate</span>
                <span className="text-[0.62rem] text-dust">{records.length} selected</span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-edge bg-void/40 px-3 py-2.5 focus-within:border-amber/60">
                <span className="text-beige">⌕</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search albums — artist or title…"
                  className="w-full bg-transparent text-sm text-cream outline-none placeholder:text-dust"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="text-dust hover:text-cream clickable">×</button>
                )}
              </div>
              <div className="no-scrollbar mt-3 max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {results.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-dust">No albums match “{query}”.</div>
                )}
                {results.map((a) => {
                  const on = records.includes(a.record);
                  return (
                    <button
                      key={a.record}
                      type="button"
                      onClick={() => toggleRecord(a.record)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors duration-200 clickable ${
                        on ? "border-amber/40 bg-amber/10" : "border-transparent hover:bg-charcoal/50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.artwork} alt="" className="h-9 w-9 shrink-0 rounded ring-1 ring-edge" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-cream">{a.album}</span>
                        <span className="block truncate text-xs text-dust">{a.artist}</span>
                      </span>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-base leading-none ${on ? "bg-amber/20 text-amber" : "text-beige"}`}>{on ? "−" : "+"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* private/public toggle */}
            <div className="mt-8 flex items-center justify-between rounded-2xl border border-edge bg-void/30 px-4 py-3.5">
              <div>
                <div className="text-sm text-cream">{isPrivate ? "Private room" : "Public room"}</div>
                <div className="text-xs text-dust">
                  {isPrivate ? "Invite-only — you share the link" : "Discoverable by anyone nearby"}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPrivate}
                onClick={() => setIsPrivate((v) => !v)}
                className={`relative h-7 w-12 rounded-full transition-colors duration-300 clickable ${isPrivate ? "bg-burnt" : "bg-edge-strong"}`}
              >
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className={`absolute top-1 h-5 w-5 rounded-full bg-cream ${isPrivate ? "left-6" : "left-1"}`}
                />
              </button>
            </div>
          </Reveal>

          {/* ── Live preview ── */}
          <Reveal delay={0.1} className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
              <span className="text-[0.62rem] uppercase tracking-[0.22em] text-dust">Live preview</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-edge bg-gradient-to-b from-charcoal/60 to-pitch/80 p-4 glow-warm">
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={genreIdx}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                  >
                    <AlbumArt sleeve={genre.sleeve} label={title || "Your night"} sub={`${genre.g} · Warsaw`} />
                  </motion.div>
                </AnimatePresence>
                <span className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.16em] backdrop-blur-sm ${isPrivate ? "bg-burnt/80 text-cream" : "bg-void/70 text-cream/80"}`}>
                  {isPrivate ? "Private" : "Public"}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-edge px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: genre.sleeve.accent }}>
                    {genre.g}
                  </span>
                  <span className="truncate text-[0.68rem] text-dust">{moodLine}</span>
                </div>
                <h3 className="mt-2 line-clamp-2 font-display text-2xl leading-tight text-cream">
                  {title || "Your night"}
                </h3>

                <div className="mt-3 flex items-center gap-1.5">
                  {records.length ? (
                    records.slice(0, 5).map((r) => {
                      const a = art(r);
                      return a ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={r} src={a} alt="" className="h-6 w-6 rounded ring-1 ring-edge" />
                      ) : (
                        <span key={r} className="h-6 w-6 rounded-full grooves ring-1 ring-edge" />
                      );
                    })
                  ) : (
                    <span className="text-[0.68rem] text-dust">Add records to the crate →</span>
                  )}
                  {records.length > 0 && <span className="ml-1 text-[0.68rem] text-dust">{records.length} records</span>}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-edge pt-4">
                  <div>
                    <div className="font-display text-xl text-cream">{price === 0 ? "Free" : `$${price}`}</div>
                    <div className="text-[0.62rem] text-amber">{capacity} seats · 0 booked</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Waveform bars={4} className="h-3 w-5" color={genre.sleeve.accent} playing={previewIsPlaying} />
                    <button
                      type="button"
                      onClick={playCratePreview}
                      disabled={!firstPlayable}
                      title={firstPlayable ? `Preview: ${firstPlayable.album} — ${firstPlayable.artist}` : "Add a record to preview"}
                      className="rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-void transition-opacity clickable disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {previewIsPlaying ? "Pause" : "Preview"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={saveDraft}
              className="mt-4 w-full rounded-full py-3.5 text-sm font-medium text-void transition-all clickable"
              style={{ background: "linear-gradient(135deg,#e8b45f,#b45f2a)", boxShadow: "0 16px 40px -14px rgba(216,154,69,0.6)" }}
            >
              {justOpened ? "✓ Draft saved" : "Save room draft"}
            </button>
            {lastDraft && (
              <div className="mt-3 rounded-2xl border border-edge bg-void/50 p-3 text-left">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-parchment">{draftMessage}</p>
                  <button
                    type="button"
                    onClick={copyDraft}
                    className="shrink-0 rounded-full border border-edge-strong px-3 py-1.5 text-xs text-cream transition-colors hover:border-amber/50 clickable"
                  >
                    Copy draft
                  </button>
                </div>
                <p className="mt-2 text-[0.68rem] text-dust">
                  Saved fields: title, genre, mood, capacity, price, visibility, and crate.
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
