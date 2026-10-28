"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon, MenuIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useUiStore } from "@/lib/stores/ui-store";
import { labelForPath } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsMenu } from "@/components/layout/notifications-menu";

/**
 * Top bar: mobile menu, search (routes to the right list page), "+ New
 * Project" (admin), notifications, theme toggle, avatar menu; plus a
 * breadcrumb strip underneath, as in the mockups.
 */
export function TopBar({ profile, notifications }) {
  const pathname = usePathname();
  const setMobileOpen = useUiStore((s) => s.setMobileNavOpen);
  const isAdmin = profile.role === "admin";
  const homeHref = isAdmin ? "/admin" : "/employee";
  const sectionLabel = labelForPath(pathname, profile.role);

  // Search is URL-param driven (rule: filters live in search params).
  const searchAction = isAdmin ? "/admin/projects" : "/employee/tasks";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <MenuIcon />
        </Button>

        <form action={searchAction} className="relative hidden max-w-md flex-1 sm:block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            type="search"
            placeholder={isAdmin ? "Search projects, tasks, clients…" : "Search my tasks…"}
            className="h-9 w-full rounded-full border bg-muted/50 pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/30"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Hidden on the Projects pages, which have their own button. */}
          {isAdmin && !pathname.startsWith("/admin/projects") && (
            <Button asChild size="sm" className="rounded-full">
              <Link href="/admin/projects?new=1">
                <PlusIcon />
                <span className="hidden sm:inline">New Project</span>
              </Link>
            </Button>
          )}

          <NotificationsMenu items={notifications.items} unread={notifications.unread} role={profile.role} />

          <ThemeToggle />
          <UserMenu profile={profile} />
        </div>
      </div>

      <nav
        aria-label="Breadcrumb"
        className="flex h-9 items-center gap-1.5 bg-muted/40 px-4 text-xs text-muted-foreground sm:px-6 lg:px-8"
      >
        <Link href={homeHref} className="inline-flex items-center gap-1 hover:text-foreground">
          <HomeIcon className="size-3.5" />
          Portal
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <span className="font-medium text-foreground">{sectionLabel}</span>
      </nav>
    </header>
  );
}
