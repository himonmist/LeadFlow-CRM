"use client";

import { useActionState, useState } from "react";
import { moveOpportunityStage, markLostOrPostponed } from "@/app/app/opportunities/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";

type Stage = { id: string; key: string; label: string; isClosed: boolean; isWon: boolean };

export function StageControls({ opportunityId, stages, currentStageId }: { opportunityId: string; stages: Stage[]; currentStageId: string }) {
  const [stageId, setStageId] = useState(currentStageId);
  const [state, formAction, pending] = useActionState<{ error?: string; success?: boolean }, FormData>(
    async (_prev, fd) => {
      const target = String(fd.get("stageId"));
      const result = await moveOpportunityStage(opportunityId, target);
      return result ?? {};
    },
    {}
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="flex items-center gap-2">
        <Select name="stageId" value={stageId} onChange={(e) => setStageId(e.target.value)} className="w-56">
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        <Button type="submit" size="sm" disabled={pending || stageId === currentStageId}>
          {pending ? "Updating..." : "Update Stage"}
        </Button>
      </form>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <form action={async () => { await markLostOrPostponed(opportunityId, "LOST"); }}>
          <Button type="submit" size="sm" variant="secondary">
            Mark Lost
          </Button>
        </form>
        <form action={async () => { await markLostOrPostponed(opportunityId, "POSTPONED"); }}>
          <Button type="submit" size="sm" variant="secondary">
            Postpone
          </Button>
        </form>
      </div>
    </div>
  );
}
