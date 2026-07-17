import { randomUUID } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { ContentDraft } from "@/types/studio";

export async function submitRender(ownerId: string, draft: ContentDraft) {
  const jobId = randomUUID();
  const supabase = await getSupabaseServer();
  if (supabase) {
    const { error } = await supabase.from("render_jobs").insert({ id: jobId, owner_id: ownerId, title: draft.title, kind: "intro", status: "processing", payload: draft });
    if (error) throw error;
  }

  if (process.env.RENDER_WEBHOOK_URL) {
    const response = await fetch(process.env.RENDER_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.RENDER_WEBHOOK_SECRET ?? ""}` }, body: JSON.stringify({ jobId, draft }) });
    if (!response.ok) throw new Error("RENDER_PROVIDER_ERROR");
  }

  return { jobId, provider: process.env.RENDER_WEBHOOK_URL ? "webhook" : "local-worker" };
}
