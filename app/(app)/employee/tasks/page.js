import { requireUser } from "@/lib/auth/guards";
import { getMyTaskDetail, groupMyTasks, listMyTasks } from "@/lib/queries/employee";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeTaskDrawer } from "@/components/tasks/employee-task-drawer";
import { MyTasksList } from "./my-tasks-list";

export const metadata = { title: "My Tasks" };

const uuidish = (v) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

export default async function MyTasksPage({ searchParams }) {
  const sp = await searchParams;
  const selectedId = uuidish(sp.task);
  const showDone = sp.done === "1";

  const { supabase } = await requireUser();
  const [rows, selected] = await Promise.all([
    listMyTasks(supabase),
    selectedId ? getMyTaskDetail(supabase, selectedId) : null,
  ]);
  const visible = showDone ? rows : rows.filter((t) => t.status !== "completed");
  const groups = groupMyTasks(visible);
  const openCount = rows.filter((t) => t.status !== "completed").length;

  return (
    <>
      <PageHeader
        eyebrow="My work"
        title="My Tasks"
        description={`${openCount} open task${openCount === 1 ? "" : "s"} across ${groups.length} client${groups.length === 1 ? "" : "s"}. Grouped by client and project.`}
      />
      <MyTasksList groups={groups} showDone={showDone} completedCount={rows.length - openCount} />
      <EmployeeTaskDrawer task={selected} />
    </>
  );
}
