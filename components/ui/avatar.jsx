import * as React from "react";

import { cn, getInitials } from "@/lib/utils";

const SIZES = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
};

/**
 * Initials-only avatar (no photos, per product rules).
 * Color is derived from the name so the same person always gets the same hue.
 * @param {{ name?: string|null, size?: "sm"|"md"|"lg", className?: string }} props
 */
function Avatar({ name, size = "md", className, ...props }) {
  const hue = hashHue(name ?? "");
  return (
    <span
      data-slot="avatar"
      title={name ?? undefined}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ring-2 ring-background",
        SIZES[size],
        className
      )}
      style={{
        backgroundColor: `oklch(0.92 0.06 ${hue})`,
        color: `oklch(0.4 0.14 ${hue})`,
      }}
      {...props}
    >
      {getInitials(name)}
    </span>
  );
}

/** Stable 0–360 hue from a string. */
function hashHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

/** Overlapping row of avatars with a "+N" overflow bubble. */
function AvatarGroup({ names = [], max = 3, size = "sm", className }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className={cn("flex -space-x-1.5", className)}>
      {shown.map((n, i) => (
        <Avatar key={`${n}-${i}`} name={n} size={size} />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-background",
            SIZES[size]
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
