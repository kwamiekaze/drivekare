import { useSyncExternalStore } from "react";
import { Vector3 } from "three";
import { CUSTOMERS } from "@/content/lot";

export type Phase = "issue" | "enroute" | "working" | "wrapup" | "leaving" | "done";

export interface JobState {
  phase: Phase;
  /** 0..1 while working */
  progress: number;
  /** Which of the bear's lines is showing: 0 arrive, 1 working, 2 done */
  line: number | null;
  /** world position of the action, for the camera and the pins */
  focus: Vector3;
}

/**
 * A tiny shared store: the 3D scene writes job phases, the HUD reads them.
 * `version` bumps only on phase changes, so React re-renders stay rare while
 * per-frame values (progress, focus) are plain mutable fields.
 */
class LotStore {
  jobs: Record<string, JobState> = {};
  /** 0 = night, 1 = day; the displayed value eases toward the target. */
  dayTarget = 1;
  day = 1;
  selected: string | null = null;
  hovered: string | null = null;
  version = 0;
  private listeners = new Set<() => void>();

  constructor() {
    this.reset();
  }

  reset() {
    this.jobs = Object.fromEntries(
      CUSTOMERS.map((c) => [c.id, { phase: "issue" as Phase, progress: 0, line: null, focus: new Vector3() }]),
    );
    this.selected = null;
    this.bump();
  }

  bump() {
    this.version += 1;
    this.listeners.forEach((l) => l());
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  select(id: string | null) {
    if (this.selected === id) return;
    this.selected = id;
    this.bump();
  }

  hover(id: string | null) {
    if (this.hovered === id) return;
    this.hovered = id;
    this.bump();
  }

  setPhase(id: string, phase: Phase) {
    const j = this.jobs[id];
    if (!j || j.phase === phase) return;
    j.phase = phase;
    this.bump();
  }

  setLine(id: string, line: number | null) {
    const j = this.jobs[id];
    if (!j || j.line === line) return;
    j.line = line;
    this.bump();
  }

  dispatch(id: string) {
    const j = this.jobs[id];
    if (j?.phase === "issue") this.setPhase(id, "enroute");
  }

  dispatchAll() {
    CUSTOMERS.forEach((c) => this.dispatch(c.id));
  }

  get fixed() {
    return CUSTOMERS.filter((c) => this.jobs[c.id]!.phase === "done").length;
  }
}

export const lotStore = new LotStore();

/** Re-renders on any phase, selection or hover change. */
export function useLot() {
  useSyncExternalStore(lotStore.subscribe, () => lotStore.version, () => 0);
  return lotStore;
}

/**
 * Frame step used by every animation. Normally the real frame time capped at
 * 50 ms so a stalled tab does not jump; `?step=0.1` pins it, which lets a slow
 * machine (or a headless test browser) play the whole sequence at any frame rate.
 */
export const sim = {
  fixed: typeof window !== "undefined" ? Number(new URLSearchParams(window.location.search).get("step")) || 0 : 0,
  lite: typeof window !== "undefined" ? new URLSearchParams(window.location.search).has("lite") : false,
};
export const stepOf = (dt: number) => sim.fixed || Math.min(dt, 0.05);
