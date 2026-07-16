import { useEffect, useRef, useState } from "react";
import { ProceduralCanvas } from "../lib/procedural-fallback";
import type { MediaSlot as MediaSlotT } from "../content/site";

export function MediaSlot({
  slot,
  className = "",
  objectPosition = "center",
}: {
  slot: MediaSlotT;
  className?: string;
  objectPosition?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
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

  const showVideo = !!slot.src && !errored;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {showVideo ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ objectPosition }}
          poster={slot.poster}
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
          aria-hidden
          onError={() => setErrored(true)}
        >
          {slot.webm ? <source src={slot.webm} type="video/webm" /> : null}
          <source src={slot.src} type="video/mp4" />
        </video>
      ) : (
        <ProceduralCanvas mode={slot.fallback} />
      )}
    </div>
  );
}
