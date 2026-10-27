"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/shared/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function isActive(pathname, item) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/** Nav list shared by the desktop rail and the mobile sheet. */
function NavItems({ nav, collapsed, onNavigate }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {nav.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
        return (
          <li key={item.href}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );
}

function UserCard({ profile, collapsed }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-sidebar-accent/60 p-3",
        collapsed && "justify-center p-2"
      )}
    >
      <Avatar name={profile.full_name ?? profile.email} size="md" />
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{profile.full_name ?? profile.email}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile.job_title ?? (profile.role === "admin" ? "Administrator" : "Team member")}
          </p>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ nav, profile }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const mobileOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileNavOpen);

  const rolePill = (
    <Badge variant={profile.role === "admin" ? "active" : "secondary"} className="capitalize">
      {profile.role}
    </Badge>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar p-3 transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className={cn("flex items-center justify-between px-1 py-2", collapsed && "justify-center")}>
          <BrandMark compact={collapsed} />
          {!collapsed && rolePill}
        </div>

        <nav className="mt-4 flex-1" aria-label="Main">
          <NavItems nav={nav} collapsed={collapsed} />
        </nav>

        <div className="space-y-2">
          <UserCard profile={profile} collapsed={collapsed} />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn("w-full justify-start text-muted-foreground", collapsed && "justify-center")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
            {!collapsed && "Collapse"}
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-3 sm:max-w-72">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center justify-between px-1 py-2">
            <BrandMark />
            {rolePill}
          </div>
          <nav className="mt-4 flex-1" aria-label="Main">
            <NavItems nav={nav} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </nav>
          <UserCard profile={profile} collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}
