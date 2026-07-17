import { GeneratorClient } from "@/components/generator-client";
import { listAssets } from "@/lib/studio-data";

export default async function GeneratorPage() {
  return <div className="content"><div className="page-head"><div><h2>유튜브 콘텐츠 생성기</h2><p>한 번의 입력으로 썸네일과 영상 인트로를 만듭니다.</p></div></div><GeneratorClient assets={await listAssets()} /></div>;
}
