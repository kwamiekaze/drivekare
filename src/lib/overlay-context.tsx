import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type OverlayName = "menu" | "services" | "about" | "contact" | "book" | "signin" | "admin" | null;

type Ctx = {
  active: OverlayName;
  open: (n: Exclude<OverlayName, null>) => void;
  close: () => void;
};

const OverlayCtx = createContext<Ctx | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<OverlayName>(null);

  const open = useCallback((n: Exclude<OverlayName, null>) => setActive(n), []);
  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return <OverlayCtx.Provider value={{ active, open, close }}>{children}</OverlayCtx.Provider>;
}

export function useOverlay() {
  const ctx = useContext(OverlayCtx);
  if (!ctx) throw new Error("useOverlay must be inside OverlayProvider");
  return ctx;
}
