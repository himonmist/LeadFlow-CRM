import { requirePermission } from "@/lib/session";
import { getPipelineBoard } from "@/lib/queries/opportunities";
import { KanbanBoard } from "@/components/app/kanban-board";

export default async function PipelinePage() {
  const user = await requirePermission("opportunity", "view");
  const columns = await getPipelineBoard(user.tenantId);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Sales Pipeline</h1>
        <p className="text-sm text-ink-500">Drag a card to move it between stages.</p>
      </div>
      <KanbanBoard columns={columns} />
    </div>
  );
}
