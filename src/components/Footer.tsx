const cols = [
  {
    title: "Discover",
    links: [
      { label: "Upcoming rooms", href: "#rooms" },
      { label: "A night in full", href: "#event" },
      { label: "How it works", href: "#how" },
      { label: "By mood", href: "#rooms" },
    ],
  },
  {
    title: "Host",
    links: [
      { label: "Open a room", href: "#host" },
      { label: "Host guide", href: "#how" },
      { label: "Equipment tips", href: "#event" },
      { label: "Pricing", href: "#host" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our story", href: "#community" },
      { label: "Collector culture", href: "#community" },
      { label: "Journal", href: "#community" },
      { label: "Contact", href: "#final" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-edge bg-pitch/50">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span className="absolute inset-0 rounded-full grooves" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-amber" />
              </span>
              <span className="font-display text-xl text-cream">Vinyl Rooms</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-parchment">
              Curated nights for people who still care about albums. A room, a record,
              and a few people who really listen.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-[0.68rem] uppercase tracking-[0.2em] text-dust">{c.title}</div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-parchment transition-colors hover:text-cream clickable">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-edge pt-6 text-xs text-dust sm:flex-row sm:items-center">
          <span>© 2026 Vinyl Listening Rooms — a concept, pressed with care.</span>
          <span className="flex gap-6">
            <a href="#" className="transition-colors hover:text-cream">Privacy</a>
            <a href="#" className="transition-colors hover:text-cream">Terms</a>
            <a href="#" className="transition-colors hover:text-cream">Instagram</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
