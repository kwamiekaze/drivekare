import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Splash } from "../components/Splash";
import { Nav } from "../components/Nav";
import { Hero } from "../components/Hero";
import { Marquee } from "../components/Marquee";
import { Services } from "../components/Services";
import { Reveal } from "../components/Reveal";
import { Process } from "../components/Process";
import { Stats } from "../components/Stats";
import { ServiceArea } from "../components/ServiceArea";
import { Testimonials } from "../components/Testimonials";
import { Finale } from "../components/Finale";
import { Footer } from "../components/Footer";
import { CustomCursor } from "../components/CustomCursor";
import { ScrollProgress } from "../components/ScrollProgress";
import { useLenis } from "../lib/use-lenis";
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
  useLenis();
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return (
    <div className="relative bg-[#0A0A0B] text-neutral-100">
      <Splash />
      <ScrollProgress />
      <CustomCursor />
      <Nav />
      <Hero />
      <Marquee />
      <Services />
      <Reveal />
      <Process />
      <Stats />
      <ServiceArea />
      <Testimonials />
      <Finale />
      <Footer />
    </div>
  );
}
