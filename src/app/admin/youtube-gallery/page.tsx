import { GalleryClient } from "@/components/gallery-client";
import { listAssets } from "@/lib/studio-data";

export default async function GalleryPage() {
  return <div className="content"><GalleryClient initialAssets={await listAssets()} /></div>;
}
