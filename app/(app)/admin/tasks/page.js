import { CheckCircle2Icon, CircleDotIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { getTaskDetail, getTaskOptions, getTaskStats, listBoard, listTasks } from "@/lib/queries/tasks";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { parseEnum, parsePage, parseQuery } from "@/lib/search-params";
import { PageHeader } from "@/components/shared/page-header";
import { TaskFormDialog } from "@/components/forms/task-form-dialog";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { TasksToolbar } from "./tasks-toolbar";
import { TasksList } from "./tasks-list";
import { KanbanBoardLoader } from "./kanban-board-loader";

export const metadata = { title: "Tasks" };

const uuidish = (v) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

function StatChip({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-soft">
      <span className={`flex size-9 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="size-[18px]" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
        <p className="font-heading text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

export default async function TasksPage({ searchParams }) {
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "board";
  const filters = {
    project: uuidish(sp.project),
    assignee: sp.assignee === "unassigned" ? "unassigned" : uuidish(sp.assignee),
    priority: parseEnum(sp.priority, TASK_PRIORITIES),
    q: parseQuery(sp.q),
  };
  const more = Object.fromEntries(
    TASK_STATUSES.map((s) => [s, Math.min(20, Math.max(0, parseInt(sp[`more_${s}`] ?? "0", 10) || 0))])
  );
  const selectedTaskId = uuidish(sp.task);

  const { supabase } = await requireAdmin();
  const [options, stats, data, selected] = await Promise.all([
    getTaskOptions(supabase),
    getTaskStats(supabase, filters),
    view === "board"
      ? listBoard(supabase, filters, more)
      : listTasks(supabase, filters, { page: parsePage(sp.page), status: parseEnum(sp.status, TASK_STATUSES) }),
    selectedTaskId ? getTaskDetail(supabase, selectedTaskId) : null,
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Delivery"
        title="Tasks"
        description="Organise and track tasks across every project, priority and assignee."
        actions={
          <>
            <StatChip icon={CircleDotIcon} label="Open" value={stats.open} tone="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300" />
            <StatChip icon={CheckCircle2Icon} label="Completed" value={stats.done} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300" />
            <TaskFormDialog options={options} defaultProjectId={filters.project} defaultOpen={sp.new === "1"} />
          </>
        }
      />

      <div className="space-y-4">
        <TasksToolbar view={view} options={options} />
        {view === "board" ? (
          <KanbanBoardLoader columns={data} more={more} />
        ) : (
          <TasksList rows={data.rows} total={data.total} page={parsePage(sp.page)} />
        )}
      </div>

      <TaskDrawer task={selected} options={options} />
    </>
  );
}
