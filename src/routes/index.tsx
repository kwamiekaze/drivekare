import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Splash } from "../components/Splash";
import { Nav } from "../components/Nav";
import { Hero } from "../components/Hero";
import { CustomCursor } from "../components/CustomCursor";
import { Overlays } from "../components/Overlays";
import { BottomBand } from "../components/BottomBand";
import { OverlayProvider } from "../lib/overlay-context";
import { AuthProvider } from "../lib/auth-context";
import { site } from "../content/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: site.meta.title },
      { name: "description", content: site.meta.description },
      { property: "og:title", content: site.meta.title },
      { property: "og:description", content: site.meta.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return (
    <AuthProvider>
      <OverlayProvider>
        <div className="relative bg-[#0A0A0B] text-neutral-100" style={{ overflowX: "clip" }}>
          <Splash />
          <CustomCursor />
          <Nav />
          <Hero />
          <BottomBand />
          <Overlays />
        </div>
      </OverlayProvider>
    </AuthProvider>
  );
}
