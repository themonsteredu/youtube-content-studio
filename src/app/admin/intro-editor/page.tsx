import { IntroEditorClient } from "@/components/intro-editor-client";
import { listAssets } from "@/lib/studio-data";

export default async function IntroEditorPage() {
  return <IntroEditorClient initialAssets={await listAssets()} />;
}
