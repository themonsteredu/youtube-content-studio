import { UnifiedContentStudioClient } from "@/components/unified-content-studio-client";
import { listAssets } from "@/lib/studio-data";

export default async function GeneratorPage({ searchParams }: { searchParams: Promise<{ mode?: string | string[] }> }) {
  const params = await searchParams;
  return <UnifiedContentStudioClient assets={await listAssets()} initialMode={params.mode === "intro" ? "intro" : "thumbnail"} />;
}
