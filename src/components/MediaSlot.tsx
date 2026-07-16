import { useCallback, useEffect, useRef, useState } from "react";
import { ProceduralCanvas } from "../lib/procedural-fallback";
import type { MediaSlot as MediaSlotT } from "../content/site";

// One-time document-level unlock: on first user gesture anywhere, retry play()
// on any paused hero video. Covers iOS Low Power Mode and other autoplay locks.
let unlockInstalled = false;
const pausedVideos = new Set<HTMLVideoElement>();
function installUnlock() {
  if (unlockInstalled || typeof document === "undefined") return;
  unlockInstalled = true;
  const retry = () => {
    pausedVideos.forEach((v) => {
      v.muted = true;
      v.play().catch(() => {});
    });
    document.removeEventListener("touchstart", retry, true);
    document.removeEventListener("pointerdown", retry, true);
    document.removeEventListener("click", retry, true);
  };
  document.addEventListener("touchstart", retry, { capture: true, once: false, passive: true });
  document.addEventListener("pointerdown", retry, { capture: true });
  document.addEventListener("click", retry, { capture: true });
}

export function MediaSlot({
  slot,
  className = "",
  objectPosition = "center",
  eager = false,
}: {
  slot: MediaSlotT;
  className?: string;
  objectPosition?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasPlayedRef = useRef(false);
  const [errored, setErrored] = useState(false);

  // Imperatively set muted/playsinline attributes BEFORE React tries to. iOS
  // Safari refuses to autoplay a video whose `muted` attribute is missing from
  // the DOM at load — and React does not render the `muted` prop as an attr.
  const videoCbRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.setAttribute("autoplay", "");
    el.setAttribute("loop", "");
    const tryPlay = () => {
      el.muted = true;
      const p = el.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          hasPlayedRef.current = true;
          pausedVideos.delete(el);
        }).catch(() => {
          pausedVideos.add(el);
        });
      }
    };
    tryPlay();
    el.addEventListener("loadedmetadata", tryPlay);
    el.addEventListener("canplay", tryPlay);
  }, []);

  useEffect(() => {
    installUnlock();
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const v = videoRef.current;
        if (!v) return;
        if (e.isIntersecting) {
          v.muted = true;
          v.play()
            .then(() => {
              hasPlayedRef.current = true;
              pausedVideos.delete(v);
            })
            .catch(() => {
              pausedVideos.add(v);
            });
        } else if (hasPlayedRef.current) {
          // Only pause after we successfully started playing at least once —
          // avoids racing the initial play attempt on iOS.
          v.pause();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      const v = videoRef.current;
      if (v) pausedVideos.delete(v);
    };
  }, []);

  const showVideo = !!slot.src && !errored;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {showVideo ? (
        <video
          ref={videoCbRef}
          className="w-full h-full object-cover"
          style={{ objectPosition }}
          poster={slot.poster}
          muted
          playsInline
          loop
          autoPlay
          preload={eager ? "auto" : "metadata"}
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
