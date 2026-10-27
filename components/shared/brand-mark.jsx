import { LayoutGridIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** FlowDesk logo tile + wordmark, as in the mockups' sidebar header. */
export function BrandMark({ inverted = false, compact = false, className }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          inverted ? "bg-white/15 text-white" : "bg-primary text-primary-foreground"
        )}
      >
        <LayoutGridIcon className="size-5" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-heading text-base font-bold">FlowDesk</span>
          <span
            className={cn(
              "block text-[11px]",
              inverted ? "text-white/70" : "text-muted-foreground"
            )}
          >
            Portal Engine
          </span>
        </span>
      )}
    </div>
  );
}
