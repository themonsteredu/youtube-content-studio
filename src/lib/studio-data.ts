import { demoAssets, demoJobs } from "@/lib/demo-data";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { MediaAsset, RenderJob } from "@/types/studio";

export async function listAssets(): Promise<MediaAsset[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return demoAssets;
  const { data, error } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, title: row.title, url: row.public_url, storagePath: row.storage_path, category: row.category, tags: row.tags ?? [], focalX: row.focal_x, focalY: row.focal_y, recommended: row.recommended, createdAt: row.created_at }));
}

export async function listJobs(): Promise<RenderJob[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return demoJobs;
  const { data, error } = await supabase.from("render_jobs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, title: row.title, kind: row.kind, status: row.status, outputUrl: row.output_url ?? undefined, createdAt: row.created_at }));
}
