import { useEffect, useRef, useState } from "react";
import { ProceduralCanvas } from "../lib/procedural-fallback";
import type { MediaSlot as MediaSlotT } from "../content/site";

export function MediaSlot({ slot, className = "" }: { slot: MediaSlotT; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        const v = videoRef.current;
        if (!v) return;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "200px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {slot.src ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={slot.src}
          poster={slot.poster}
          muted
          playsInline
          loop
          preload="metadata"
          aria-hidden
        />
      ) : (
        visible !== null && <ProceduralCanvas mode={slot.fallback} />
      )}
    </div>
  );
}
