import { cn } from "@/lib/utils";

/**
 * Inline validation text under a field, or a `banner` for form-level errors.
 * Renders nothing when there is no message, so it can be placed unconditionally.
 */
export function FormMessage({ children, variant = "inline", className }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={cn(
        "text-sm text-destructive",
        variant === "banner" &&
          "rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2",
        className
      )}
    >
      {children}
    </p>
  );
}
