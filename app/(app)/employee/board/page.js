import { requireUser } from "@/lib/auth/guards";
import { getMyTaskDetail, listMyTasks } from "@/lib/queries/employee";
import { TASK_STATUSES } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeTaskDrawer } from "@/components/tasks/employee-task-drawer";
import { MyBoardLoader } from "./my-board-loader";

export const metadata = { title: "My Board" };

const uuidish = (v) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

/** Shapes a view row like the admin board's card data. */
function toCard(t) {
  return {
    ...t,
    project: { id: t.project_id, name: t.project_name, client: { company_name: t.client_company_name } },
    assignee: null,
  };
}

export default async function MyBoardPage({ searchParams }) {
  const sp = await searchParams;
  const selectedId = uuidish(sp.task);

  const { supabase } = await requireUser();
  const [rows, selected] = await Promise.all([
    listMyTasks(supabase),
    selectedId ? getMyTaskDetail(supabase, selectedId) : null,
  ]);

  const columns = Object.fromEntries(
    TASK_STATUSES.map((s) => [s, rows.filter((t) => t.status === s).map(toCard)])
  );

  return (
    <>
      <PageHeader
        eyebrow="My work"
        title="My Board"
        description="Your tasks only. Drag a card to another column to change its status."
      />
      <MyBoardLoader columns={columns} />
      <EmployeeTaskDrawer task={selected} />
    </>
  );
}
