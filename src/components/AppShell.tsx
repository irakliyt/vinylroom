"use client";

import { type Room } from "@/data/rooms";
import { LayoutGroup } from "framer-motion";
import dynamic from "next/dynamic";
import { MemberProvider } from "@/components/member/MemberProvider";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { BookingProvider } from "@/components/booking/BookingProvider";
import SpotlightBackground from "@/components/SpotlightBackground";
import NoiseOverlay from "@/components/NoiseOverlay";
import CustomCursor from "@/components/CustomCursor";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import NowPlayingWidget from "@/components/NowPlayingWidget";

const FeaturedRooms = dynamic(() => import("@/components/FeaturedRooms"), {
  loading: () => null,
});
const HowItWorks = dynamic(() => import("@/components/HowItWorks"), {
  loading: () => null,
});
const EventDetailPreview = dynamic(() => import("@/components/EventDetailPreview"), {
  loading: () => null,
});
const CreateRoomPreview = dynamic(() => import("@/components/CreateRoomPreview"), {
  loading: () => null,
});
const Community = dynamic(() => import("@/components/Community"), {
  loading: () => null,
});
const FinalCTA = dynamic(() => import("@/components/FinalCTA"), {
  loading: () => null,
});
const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => null,
});

export default function AppShell({
  rooms,
  source,
}: {
  rooms: Room[];
  source: "wix" | "mock";
}) {
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
              <EventDetailPreview event={rooms[0]} />
              <CreateRoomPreview />
              <Community />
              <FinalCTA />
            </main>

            <Footer />
          </BookingProvider>
        </LayoutGroup>
      </PlayerProvider>
    </MemberProvider>
  );
}
