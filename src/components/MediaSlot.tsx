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
  };
  document.addEventListener("touchstart", retry, { capture: true, passive: true });
  document.addEventListener("pointerdown", retry, { capture: true });
  document.addEventListener("click", retry, { capture: true });
}

export function MediaSlot({
  slot,
  className = "",
  objectPosition = "center",
  eager = false,
  dim = false,
}: {
  slot: MediaSlotT;
  className?: string;
  objectPosition?: string;
  eager?: boolean;
  dim?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errored, setErrored] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const videoCbRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    // Set attrs imperatively BEFORE play(): required by iOS.
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.setAttribute("autoplay", "");
    el.setAttribute("loop", "");
    el.setAttribute("preload", "auto");

    const markFrame = () => setHasFrame(true);
    const tryPlay = () => {
      el.muted = true;
      const p = el.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          pausedVideos.delete(el);
          setHasFrame(true);
        }).catch(() => pausedVideos.add(el));
      }
    };
    tryPlay();
    el.addEventListener("loadedmetadata", tryPlay);
    el.addEventListener("loadeddata", markFrame);
    el.addEventListener("canplay", tryPlay);
    el.addEventListener("canplaythrough", tryPlay);
    el.addEventListener("playing", markFrame);
  }, []);

  useEffect(() => {
    installUnlock();
    if (!slot.src) return;
    // Fallback appears ONLY if the video has neither loaded a frame nor errored within ~4s.
    const t = window.setTimeout(() => {
      if (!hasFrame && !errored) setShowFallback(true);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [slot.src, hasFrame, errored]);

  const showVideo = !!slot.src && !errored;
  // Hide procedural fallback the moment real frames are ready.
  const renderFallback = !showVideo || (showFallback && !hasFrame);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {renderFallback ? (
        <div className="absolute inset-0 z-0">
          <ProceduralCanvas mode={slot.fallback} />
        </div>
      ) : null}
      {showVideo ? (
        <video
          ref={videoCbRef}
          className="relative z-[1] w-full h-full object-cover"
          style={{ objectPosition, opacity: dim ? 0.45 : 1 }}
          poster={slot.poster}
          muted
          playsInline
          loop
          autoPlay
          preload="auto"
          aria-hidden
          onLoadedData={() => setHasFrame(true)}
          onPlaying={() => {
            setHasFrame(true);
            setShowFallback(false);
          }}
          onError={() => setErrored(true)}
        >
          {slot.webm ? <source src={slot.webm} type="video/webm" /> : null}
          <source src={slot.src} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}

