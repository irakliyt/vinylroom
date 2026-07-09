"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeLogin } from "@/lib/wix/auth";
import VinylDisc from "@/components/VinylDisc";

export default function LoginCallback() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    completeLogin()
      .then((returnTo) => router.replace(returnTo || "/"))
      .catch(() => setFailed(true));
  }, [router]);

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center gap-6 bg-void px-5 text-center">
      <div className="h-20 w-20">
        <VinylDisc accent="#d89a45" spinning={!failed} className="h-full w-full" />
      </div>
      {failed ? (
        <>
          <p className="font-display text-2xl text-cream">We couldn&apos;t finish signing you in.</p>
          <a href="/" className="rounded-full border border-edge-strong px-6 py-3 text-sm text-cream clickable">
            Back home
          </a>
        </>
      ) : (
        <p className="eyebrow">Cueing up your session…</p>
      )}
    </main>
  );
}
