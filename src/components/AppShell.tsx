"use client";

import { type Room } from "@/data/rooms";
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
import EventDetailPreview from "@/components/EventDetailPreview";
import CreateRoomPreview from "@/components/CreateRoomPreview";
import Community from "@/components/Community";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import NowPlayingWidget from "@/components/NowPlayingWidget";

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
      </PlayerProvider>
    </MemberProvider>
  );
}
