"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Player } from "@remotion/player";
import { Download, Film, Image as ImageIcon, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { listLocalAssets, mergeAssets } from "@/lib/local-media";
import { IntroComposition } from "@/remotion/intro-composition";
import type { ContentDraft, MediaAsset } from "@/types/studio";

const schema = z.object({
  title: z.string().min(2, "제목을 두 글자 이상 입력하세요.").max(60, "제목은 60자 이내로 입력하세요."),
  subtitle: z.string().max(80, "부제는 80자 이내로 입력하세요."),
  episode: z.string().max(20),
  imageUrl: z.string().min(1),
  imageId: z.string().optional(),
  template: z.enum(["bold", "documentary", "clean"]),
  accent: z.string(),
  duration: z.number().min(3).max(12),
});

export function GeneratorClient({ assets }: { assets: MediaAsset[] }) {
  const [availableAssets, setAvailableAssets] = useState(assets);
  const first = availableAssets[0];
  const [tab, setTab] = useState<"thumbnail" | "intro">("thumbnail");
  const [busy, setBusy] = useState<"png" | "mp4" | null>(null);
  const [message, setMessage] = useState("");
  const { register, control, setValue, handleSubmit, formState: { errors } } = useForm<ContentDraft>({
    resolver: zodResolver(schema),
    defaultValues: { title: "AI 시대, 아이에게 정말 필요한 공부", subtitle: "별거 다하는 원장님의 교육 실험", episode: "EP. 12", imageUrl: first?.url ?? "", imageId: first?.id, template: "bold", accent: "#f2c94c", duration: 6 },
  });
  const watched = useWatch({ control });
  const values: ContentDraft = {
    title: watched.title ?? "",
    subtitle: watched.subtitle ?? "",
    episode: watched.episode ?? "",
    imageUrl: watched.imageUrl ?? first?.url ?? "",
    imageId: watched.imageId,
    template: watched.template ?? "bold",
    accent: watched.accent ?? "#f2c94c",
    duration: watched.duration ?? 6,
  };
  const frames = Math.round((values.duration || 6) * 30);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      listLocalAssets()
        .then((localAssets) => setAvailableAssets((current) => mergeAssets(localAssets, current)))
        .catch(() => undefined);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const downloadPng = handleSubmit(async (draft) => {
    setBusy("png"); setMessage("");
    const response = await fetch("/api/thumbnail", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
    if (!response.ok) { setMessage("PNG 생성에 실패했습니다."); setBusy(null); return; }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "youtube-thumbnail.png"; anchor.click();
    URL.revokeObjectURL(url); setBusy(null); setMessage("PNG 파일을 생성했습니다.");
  });

  const submitMp4 = handleSubmit(async (draft) => {
    setBusy("mp4"); setMessage("");
    const response = await fetch("/api/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, kind: "intro" }) });
    const payload = await response.json();
    setBusy(null); setMessage(response.ok ? `렌더 작업을 등록했습니다. (${payload.jobId})` : payload.error ?? "작업 등록에 실패했습니다.");
  });

  return (
    <div className="generator-grid">
      <section className="panel">
        <div className="panel-head"><h3>콘텐츠 설정</h3><span className="chip">자동 저장 준비</span></div>
        <div className="panel-body">
          <div className="notice">입력 내용은 오른쪽 미리보기에 즉시 반영됩니다.</div>
          <div className="field"><label className="label">메인 제목</label><textarea className="textarea" {...register("title")} />{errors.title && <p className="form-error">{errors.title.message}</p>}</div>
          <div className="field"><label className="label">부제</label><input className="input" {...register("subtitle")} />{errors.subtitle && <p className="form-error">{errors.subtitle.message}</p>}</div>
          <div className="field-row">
            <div className="field"><label className="label">회차 표기</label><input className="input" {...register("episode")} /></div>
            <div className="field"><label className="label">템플릿</label><select className="select" {...register("template")}><option value="bold">강조형</option><option value="documentary">다큐형</option><option value="clean">클린형</option></select></div>
          </div>
          <div className="field"><label className="label">대표 이미지</label><select className="select" value={values.imageId} onChange={(event) => { const item = availableAssets.find((asset) => asset.id === event.target.value); if (item) { setValue("imageId", item.id); setValue("imageUrl", item.url); } }}>{availableAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.title}</option>)}</select></div>
          <div className="field-row">
            <div className="field"><label className="label">강조 색상</label><input className="input" type="color" {...register("accent")} /></div>
            <div className="field"><label className="label">인트로 길이 · {values.duration}초</label><input className="range" type="range" min="3" max="12" step="1" {...register("duration", { valueAsNumber: true })} /></div>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button className="button" disabled={Boolean(busy)} onClick={downloadPng}>{busy === "png" ? <LoaderCircle size={15} /> : <Download size={15} />} PNG 생성</button>
            <button className="button secondary" disabled={Boolean(busy)} onClick={submitMp4}>{busy === "mp4" ? <LoaderCircle size={15} /> : <Film size={15} />} MP4 렌더</button>
          </div>
          {message && <p style={{ fontSize: 12, color: "#176b62", marginBottom: 0 }}>{message}</p>}
        </div>
      </section>

      <section className="preview-stack">
        <div className="panel">
          <div className="panel-head"><h3>실시간 미리보기</h3><div><button className={`button ${tab === "thumbnail" ? "" : "secondary"}`} onClick={() => setTab("thumbnail")}><ImageIcon size={14} /> 썸네일</button> <button className={`button ${tab === "intro" ? "" : "secondary"}`} onClick={() => setTab("intro")}><Film size={14} /> 인트로</button></div></div>
          <div className="panel-body">
            {tab === "thumbnail" ? <div className="preview-frame"><div className="thumb-stage" style={{ backgroundImage: `url(${values.imageUrl})` }}><div className="thumb-copy"><span className="thumb-kicker">{values.episode || "NEW"}</span><div className="thumb-title">{values.title || "제목을 입력하세요"}</div></div></div></div> : <Player component={IntroComposition} inputProps={values} durationInFrames={frames} compositionWidth={1920} compositionHeight={1080} fps={30} controls loop style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 6, overflow: "hidden" }} />}
            <div className="meta-row"><span className="chip">1920 × 1080</span><span className="chip">16:9</span><span className="chip">{tab === "thumbnail" ? "PNG" : `${values.duration}초 · 30fps`}</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}
