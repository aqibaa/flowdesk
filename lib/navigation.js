import {
  LayoutDashboardIcon,
  RadioIcon,
  FolderKanbanIcon,
  CheckCircle2Icon,
  LayersIcon,
  UsersIcon,
  BuildingIcon,
  SettingsIcon,
  ListTodoIcon,
} from "lucide-react";

/**
 * Sidebar navigation per role. `exact` marks items that should only be
 * highlighted on an exact path match (the role's dashboard), everything
 * else highlights on prefix match.
 */
export const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, exact: true },
  { label: "Global Monitor", href: "/admin/monitor", icon: RadioIcon },
  { label: "Projects", href: "/admin/projects", icon: FolderKanbanIcon },
  { label: "Tasks", href: "/admin/tasks", icon: CheckCircle2Icon },
  { label: "Services", href: "/admin/services", icon: LayersIcon },
  { label: "Team", href: "/admin/team", icon: UsersIcon },
  { label: "Clients", href: "/admin/clients", icon: BuildingIcon },
  { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
];

export const EMPLOYEE_NAV = [
  { label: "Dashboard", href: "/employee", icon: LayoutDashboardIcon, exact: true },
  { label: "My Tasks", href: "/employee/tasks", icon: ListTodoIcon },
];

export function navForRole(role) {
  return role === "admin" ? ADMIN_NAV : EMPLOYEE_NAV;
}

/** Breadcrumb label lookup used by the top bar strip. */
export function labelForPath(pathname, role) {
  const nav = navForRole(role);
  const match = nav
    .filter((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Overview";
}
