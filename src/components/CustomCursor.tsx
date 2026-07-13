import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.body.classList.add("dk-cursor-active");

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;
    let scale = 1;

    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
      const target = e.target as HTMLElement;
      const interactive = target.closest("a,button,[data-interactive],input,textarea,select,[role=button]");
      scale = interactive ? 1.8 : 1;
    };

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0) scale(${scale})`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
      document.body.classList.remove("dk-cursor-active");
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="dk-cursor fixed top-0 left-0 z-[9999] pointer-events-none w-1.5 h-1.5 rounded-full"
        style={{ background: "linear-gradient(180deg,#F2F3F5,#9BA0A8)", mixBlendMode: "difference" }}
      />
      <div
        ref={ringRef}
        className="dk-cursor fixed top-0 left-0 z-[9999] pointer-events-none w-8 h-8 rounded-full border transition-[transform] duration-100 ease-out"
        style={{ borderColor: "#F08A1D", boxShadow: "0 0 12px rgba(240,138,29,0.5)" }}
      />
    </>
  );
}
