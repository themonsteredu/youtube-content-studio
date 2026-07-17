import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const jobId = process.argv[2];
  if (!jobId) throw new Error("Usage: npm run render:worker -- <job-id>");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are required.");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: job, error } = await supabase.from("render_jobs").select("*").eq("id", jobId).single();
  if (error || !job) throw error ?? new Error("Render job not found.");

  try {
    const serveUrl = await bundle({ entryPoint: path.resolve("src/remotion/index.tsx") });
    const composition = await selectComposition({ serveUrl, id: "YoutubeIntro", inputProps: job.payload });
    const output = path.resolve("tmp", `${jobId}.mp4`);
    await renderMedia({ composition: { ...composition, durationInFrames: Math.round(job.payload.duration * 30) }, serveUrl, codec: "h264", outputLocation: output, inputProps: job.payload });
    const bytes = await import("node:fs/promises").then((fs) => fs.readFile(output));
    const storagePath = `${job.owner_id}/${jobId}.mp4`;
    const { error: uploadError } = await supabase.storage.from("youtube-renders").upload(storagePath, bytes, { contentType: "video/mp4", upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("youtube-renders").getPublicUrl(storagePath);
    await supabase.from("render_jobs").update({ status: "ready", output_url: data.publicUrl, completed_at: new Date().toISOString() }).eq("id", jobId);
  } catch (renderError) {
    await supabase.from("render_jobs").update({ status: "failed", error_message: renderError instanceof Error ? renderError.message : "Unknown render error" }).eq("id", jobId);
    throw renderError;
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
