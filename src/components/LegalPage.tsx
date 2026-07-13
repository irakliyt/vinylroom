import type { ReactNode } from "react";
import Link from "next/link";

export default function LegalPage({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[100svh] bg-void px-5 py-8 text-cream sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-sm text-parchment transition-colors hover:text-amber"
        >
          <span aria-hidden="true">←</span>
          Vinyl Rooms
        </Link>

        <header className="mt-14 border-b border-edge pb-10 sm:mt-20 sm:pb-14">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="mt-5 max-w-3xl font-display text-[clamp(3rem,9vw,6.75rem)] leading-[0.88] tracking-[-0.045em]">
            {title}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-parchment sm:text-lg">
            {summary}
          </p>
          <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-dust">
            Last updated July 13, 2026
          </p>
        </header>

        <article className="legal-copy py-10 sm:py-14">{children}</article>

        <footer className="flex flex-col gap-4 border-t border-edge py-8 text-sm text-dust sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Vinyl Listening Rooms</span>
          <Link href="/" className="text-parchment transition-colors hover:text-amber">
            Return home
          </Link>
        </footer>
      </div>
    </main>
  );
}
