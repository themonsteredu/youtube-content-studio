"use client";

import { Film, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { GeneratorClient } from "@/components/generator-client";
import { IntroEditorClient } from "@/components/intro-editor-client";
import type { MediaAsset } from "@/types/studio";

type StudioMode = "thumbnail" | "intro";

export function UnifiedContentStudioClient({ assets, initialMode }: { assets: MediaAsset[]; initialMode: StudioMode }) {
  const [mode, setMode] = useState<StudioMode>(initialMode);

  function selectMode(nextMode: StudioMode) {
    setMode(nextMode);
    const url = new URL(window.location.href);
    if (nextMode === "intro") url.searchParams.set("mode", "intro");
    else url.searchParams.delete("mode");
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div className="content unified-studio-page">
      <div className="page-head unified-studio-head">
        <div>
          <h2>유튜브 콘텐츠 스튜디오</h2>
          <p>같은 이미지 소재로 썸네일을 디자인하고 영상 인트로까지 이어서 만듭니다.</p>
        </div>
        <div className="studio-mode-tabs" role="tablist" aria-label="콘텐츠 편집 종류">
          <button type="button" role="tab" aria-selected={mode === "thumbnail"} className={mode === "thumbnail" ? "active" : ""} onClick={() => selectMode("thumbnail")}><ImageIcon size={16} /> 썸네일 편집</button>
          <button type="button" role="tab" aria-selected={mode === "intro"} className={mode === "intro" ? "active" : ""} onClick={() => selectMode("intro")}><Film size={16} /> 인트로 편집</button>
        </div>
      </div>

      <div className={mode === "thumbnail" ? "studio-workspace active" : "studio-workspace"} role="tabpanel" aria-hidden={mode !== "thumbnail"}>
        <GeneratorClient assets={assets} />
      </div>
      <div className={mode === "intro" ? "studio-workspace active" : "studio-workspace"} role="tabpanel" aria-hidden={mode !== "intro"}>
        <IntroEditorClient initialAssets={assets} embedded />
      </div>
    </div>
  );
}
