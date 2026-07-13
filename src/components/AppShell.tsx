"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { type Room } from "@/data/rooms";
import { LayoutGroup } from "framer-motion";
import { MemberProvider } from "@/components/member/MemberProvider";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { BookingProvider } from "@/components/booking/BookingProvider";
import SpotlightBackground from "@/components/SpotlightBackground";
import NoiseOverlay from "@/components/NoiseOverlay";
import CustomCursor from "@/components/CustomCursor";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import FeaturedRooms from "@/components/FeaturedRooms";
import HowItWorks from "@/components/HowItWorks";
import NowPlayingWidget from "@/components/NowPlayingWidget";

const DeferredPageSections = dynamic(() => import("@/components/DeferredPageSections"), {
  ssr: false,
});

const DEFERRED_HASHES = new Set(["#event", "#host", "#community", "#final"]);

export default function AppShell({
  rooms,
  source,
}: {
  rooms: Room[];
  source: "wix" | "mock";
}) {
  const deferredSentinelRef = useRef<HTMLDivElement>(null);
  const [showDeferredSections, setShowDeferredSections] = useState(false);

  useEffect(() => {
    const revealForHash = () => {
      if (DEFERRED_HASHES.has(window.location.hash)) setShowDeferredSections(true);
    };
    window.addEventListener("hashchange", revealForHash);

    const sentinel = deferredSentinelRef.current;
    const observer = sentinel
      ? new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            setShowDeferredSections(true);
          },
          { rootMargin: "1000px 0px" },
        )
      : null;
    if (sentinel) observer?.observe(sentinel);

    if (DEFERRED_HASHES.has(window.location.hash)) {
      queueMicrotask(() => setShowDeferredSections(true));
    }

    return () => {
      window.removeEventListener("hashchange", revealForHash);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!showDeferredSections || !DEFERRED_HASHES.has(window.location.hash)) return;
    const frame = requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [showDeferredSections]);

  return (
    <MemberProvider>
      <PlayerProvider>
        <LayoutGroup id="vinyl-room-flow">
          <BookingProvider>
            <SpotlightBackground />
            <NoiseOverlay />
            <CustomCursor />
            <Navigation source={source} roomCount={rooms.length} />
            <NowPlayingWidget rooms={rooms} />

            <main className="relative">
              <Hero rooms={rooms} />
              <FeaturedRooms rooms={rooms} source={source} />
              <HowItWorks />
              <div ref={deferredSentinelRef} className="h-px" aria-hidden="true" />
              {showDeferredSections ? <DeferredPageSections event={rooms[0]} /> : null}
            </main>
          </BookingProvider>
        </LayoutGroup>
      </PlayerProvider>
    </MemberProvider>
  );
}
