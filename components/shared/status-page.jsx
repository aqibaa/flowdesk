import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/shared/brand-mark";

/**
 * Full-height "status" screen for 404 / 500 pages: big code, title, copy
 * and actions. `inShell` drops the brand + full-screen chrome so it can sit
 * inside the portal layout.
 * @param {{ code: string, title: string, description?: string, actions?: React.ReactNode, inShell?: boolean, tone?: "primary"|"danger" }} props
 */
export function StatusPage({ code, title, description, actions, inShell = false, tone = "primary" }) {
  const body = (
    <div className="relative mx-auto w-full max-w-lg text-center">
      <p
        aria-hidden
        className={cn(
          "font-heading select-none text-[7rem] font-extrabold leading-none tracking-tighter sm:text-[9rem]",
          "bg-gradient-to-br bg-clip-text text-transparent",
          tone === "danger" ? "from-rose-500 to-orange-400" : "from-primary to-violet-400"
        )}
      >
        {code}
      </p>
      <h1 className="font-heading mt-2 text-2xl font-bold sm:text-3xl">{title}</h1>
      {description && <p className="mt-3 text-sm text-muted-foreground sm:text-base">{description}</p>}
      {actions && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </div>
  );

  if (inShell) return <div className="flex min-h-[60vh] items-center py-10">{body}</div>;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6">
      {/* soft glow behind the code */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/3 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl",
          tone === "danger" ? "bg-rose-500/15" : "bg-primary/15"
        )}
      />
      <BrandMark className="absolute left-6 top-6" />
      {body}
    </main>
  );
}
