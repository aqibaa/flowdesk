"use client";

const COLORS = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6"];

/**
 * Confetti-lite: 12 CSS-animated particles bursting from the parent element.
 * Pure CSS (globals.css `.confetti-piece`); unmounts itself via `onDone`.
 */
export function ConfettiBurst({ onDone }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
      onAnimationEnd={onDone}
    >
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = 28 + (i % 3) * 10;
        return (
          <span
            key={i}
            className="confetti-piece absolute left-1/2 top-1/2 block size-1.5 rounded-sm"
            style={{
              background: COLORS[i % COLORS.length],
              "--dx": `${Math.cos(angle) * dist}px`,
              "--dy": `${Math.sin(angle) * dist}px`,
              animationDelay: `${(i % 4) * 20}ms`,
            }}
          />
        );
      })}
    </span>
  );
}
