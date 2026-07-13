import React from "react";

/**
 * Split text into whitespace-safe word groups with per-character spans.
 * Each char span has data-polish attributes so GSAP can animate them
 * from a "dull" gunmetal state to a "hot" chrome+orange state.
 *
 * Usage: renderPolishTitle("AUTO CARE ANYWHERE")
 */
export function renderPolishTitle(text: string, keyPrefix = "p") {
  const words = text.split(/(\s+)/);
  let charIndex = 0;
  return (
    <>
      {words.map((w, wi) => {
        if (/^\s+$/.test(w)) {
          return (
            <span key={`${keyPrefix}-s-${wi}`} aria-hidden style={{ display: "inline-block", width: "0.28em" }} />
          );
        }
        const chars = Array.from(w);
        return (
          <span
            key={`${keyPrefix}-w-${wi}`}
            className="inline-flex whitespace-nowrap"
            style={{ display: "inline-flex" }}
          >
            {chars.map((c, ci) => {
              const idx = charIndex++;
              return (
                <span
                  key={ci}
                  data-polish
                  data-polish-index={idx}
                  className="relative inline-block dull will-change-[background,color]"
                  style={{ display: "inline-block" }}
                >
                  {c}
                </span>
              );
            })}
          </span>
        );
      })}
    </>
  );
}
