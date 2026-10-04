import { Html } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Customer, JobKind } from "@/content/lot";
import { lotStore, useLot } from "./store";

const ICON: Record<JobKind, string> = {
  tire: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z",
  battery: "M4 8h14v10H4zM7 5h3v3H7zM13 5h3v3h-3zM9 11l3 2-2 2",
  oil: "M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z",
  diagnostics: "M3 12h4l2-6 4 12 2-6h6",
  detailing: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  brakes: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM12 2v3M12 19v3",
};

export function KindIcon({ kind, className = "h-4 w-4" }: { kind: JobKind; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON[kind]} />
    </svg>
  );
}

/** A floating pin over each customer: what is wrong, then live progress, then fixed. */
export function Pin({ customer: c, position }: { customer: Customer; position: [number, number, number] }) {
  const s = useLot();
  const job = s.jobs[c.id]!;
  const ring = useRef<HTMLSpanElement>(null);
  useFrame(() => {
    if (ring.current) ring.current.style.setProperty("--p", `${Math.round(lotStore.jobs[c.id]!.progress * 360)}deg`);
  });
  const sel = s.selected === c.id;
  const dim = s.selected && !sel;
  const label =
    job.phase === "issue" ? c.label : job.phase === "enroute" ? "On the way" : job.phase === "working" ? "Working" : job.phase === "done" ? "Fixed" : "Wrapping up";
  return (
    <Html position={position} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
      <button
        type="button"
        onClick={() => lotStore.select(c.id)}
        onPointerEnter={() => lotStore.hover(c.id)}
        onPointerLeave={() => lotStore.hover(null)}
        aria-label={`${c.owner}, ${c.label}. ${label}`}
        data-phase={job.phase}
        className={`lot-pin ${sel ? "is-sel" : ""} ${dim ? "is-dim" : ""}`}
      >
        <span ref={ring} className="lot-pin-ring">
          <span className="lot-pin-core">
            {job.phase === "done" ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            ) : (
              <KindIcon kind={c.kind} />
            )}
          </span>
        </span>
        <span className="lot-pin-label">{label}</span>
      </button>
    </Html>
  );
}
