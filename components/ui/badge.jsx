import * as React from "react";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Status chips — task_status
        todo: "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
        in_progress:
          "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
        in_review:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
        completed:
          "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
        // Priority chips — task_priority
        low: "border-transparent bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
        medium:
          "border-transparent bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
        high: "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
        urgent:
          "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
        // project_status
        pending:
          "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
        active:
          "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
        on_hold:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
        cancelled:
          "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
