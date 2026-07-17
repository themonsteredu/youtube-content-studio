"use client";

import { Player } from "@remotion/player";
import { ArrowDown, ArrowUp, Download, FlipHorizontal2, Image as ImageIcon, Images, Layers3, LoaderCircle, MonitorPlay, Plus, RotateCcw, Save, Sparkles, Square, Trash2, Type, UserRoundPlus } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Rnd } from "react-rnd";
import { IntroAiAssets } from "@/components/intro-ai-assets";
import { listLocalAssets, loadLocalScene, mergeAssets, saveLocalScene } from "@/lib/local-media";
import { defaultScene, sceneImageFilter, SceneComposition } from "@/remotion/scene-composition";
import type { IntroScene, IntroSceneElement, MediaAsset, SceneAnimation } from "@/types/studio";

const animationLabels: Record<SceneAnimation, string> = {
  none: "효과 없음",
  fade: "서서히 등장",
  "slide-left": "왼쪽에서 등장",
  "slide-right": "오른쪽에서 등장",
  rise: "아래에서 등장",
  pop: "확대되며 등장",
};

export function IntroEditorClient({ initialAssets }: { initialAssets: MediaAsset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [scene, setScene] = useState<IntroScene>(defaultScene);
  const [selectedId, setSelectedId] = useState<string | null>(defaultScene.elements[0]?.id ?? null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [assetSource, setAssetSource] = useState<"gallery" | "ai">("gallery");
  const [scale, setScale] = useState(0.5);
  const [ready, setReady] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "rendering" | "complete" | "error">("idle");
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      Promise.all([listLocalAssets(), loadLocalScene()])
        .then(([localAssets, storedScene]) => {
          setAssets(mergeAssets(localAssets, initialAssets));
          if (storedScene) {
            setScene(storedScene);
            setSelectedId(storedScene.elements[0]?.id ?? null);
          }
        })
        .catch(() => undefined)
        .finally(() => setReady(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialAssets]);

  useEffect(() => {
    if (!ready) return;
    const container = canvasRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(entry.contentRect.width / 1920, 1)));
    observer.observe(container);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      void saveLocalScene(scene);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [ready, scene]);

  useEffect(() => () => exportControllerRef.current?.abort(), []);

  const selected = useMemo(() => scene.elements.find((element) => element.id === selectedId) ?? null, [scene.elements, selectedId]);
  const orderedElements = useMemo(() => [...scene.elements].sort((a, b) => b.zIndex - a.zIndex), [scene.elements]);
  const frames = Math.max(90, Math.round(scene.duration * 30));

  function updateElement(id: string, patch: Partial<IntroSceneElement>) {
    setScene((current) => ({ ...current, elements: current.elements.map((element) => element.id === id ? { ...element, ...patch } : element) }));
  }

  function addAsset(asset: MediaAsset, type: "background" | "image") {
    const topLayer = Math.max(0, ...scene.elements.map((element) => element.zIndex));
    const element: IntroSceneElement = type === "background"
      ? { id: crypto.randomUUID(), type, name: asset.title, src: asset.url, x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 1, zIndex: 0, start: 0, end: scene.duration, animation: "fade", brightness: 100, blur: 0 }
      : { id: crypto.randomUUID(), type: asset.category === "portrait" ? "image" : "logo", name: asset.title, src: asset.url, x: 1280, y: 120, width: 520, height: 820, rotation: 0, opacity: 1, zIndex: topLayer + 1, start: 0.3, end: scene.duration - 0.3, animation: "slide-right", brightness: 100, blur: 0, flipX: false, outlineColor: "#ffffff", outlineWidth: 0, shadow: 18 };

    setScene((current) => ({ ...current, elements: type === "background" ? [...current.elements.filter((item) => item.type !== "background"), element] : [...current.elements, element] }));
    setSelectedId(element.id);
    setMode("edit");
  }

  function addGeneratedAsset(asset: MediaAsset, type: "background" | "image") {
    setAssets((current) => mergeAssets([asset], current));
    addAsset(asset, type);
  }

  function addText() {
    const topLayer = Math.max(0, ...scene.elements.map((element) => element.zIndex));
    const element: IntroSceneElement = { id: crypto.randomUUID(), type: "text", name: "텍스트", text: "새 문구를 입력하세요", x: 120, y: 390, width: 980, height: 210, rotation: 0, opacity: 1, zIndex: topLayer + 1, start: 0.5, end: scene.duration - 0.4, animation: "rise", color: "#ffffff", fontSize: 84, fontWeight: 900 };
    setScene((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
    setMode("edit");
  }

  function removeSelected() {
    if (!selected) return;
    setScene((current) => ({ ...current, elements: current.elements.filter((element) => element.id !== selected.id) }));
    setSelectedId(null);
  }

  function moveLayer(direction: 1 | -1) {
    if (!selected) return;
    updateElement(selected.id, { zIndex: Math.max(0, selected.zIndex + direction) });
  }

  function resetScene() {
    if (!window.confirm("현재 인트로 장면을 초기화할까요?")) return;
    setScene(defaultScene);
    setSelectedId(defaultScene.elements[0]?.id ?? null);
    setMode("edit");
  }

  async function exportMp4() {
    const controller = new AbortController();
    exportControllerRef.current = controller;
    setMode("preview");
    setExportStatus("rendering");
    setExportProgress(0);
    setExportError("");

    try {
      const { renderMediaOnWeb } = await import("@remotion/web-renderer");
      const result = await renderMediaOnWeb({
        composition: {
          id: "SceneIntroExport",
          component: SceneComposition,
          width: 1920,
          height: 1080,
          fps: 30,
          durationInFrames: frames,
          defaultProps: { scene },
        },
        inputProps: { scene },
        container: "mp4",
        videoCodec: "h264",
        videoBitrate: "high",
        hardwareAcceleration: "prefer-hardware",
        muted: true,
        licenseKey: "free-license",
        signal: controller.signal,
        onProgress: ({ progress }) => {
          setExportProgress(Math.min(99, Math.round(progress * 100)));
        },
      });

      const blob = await result.getBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `youtube-intro-${date}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportProgress(100);
      setExportStatus("complete");
    } catch (error) {
      if (controller.signal.aborted) {
        setExportStatus("idle");
        setExportProgress(0);
      } else {
        setExportStatus("error");
        setExportError(error instanceof Error ? error.message : "영상 생성 중 오류가 발생했습니다.");
      }
    } finally {
      if (exportControllerRef.current === controller) exportControllerRef.current = null;
    }
  }

  function cancelExport() {
    exportControllerRef.current?.abort();
  }

  if (!ready) return <div className="content"><div className="panel empty">인트로 편집기를 불러오는 중입니다.</div></div>;

  return (
    <div className="content intro-editor-page">
      <div className="page-head intro-editor-head">
        <div><h2>인트로 편집기</h2><p>요소를 클릭해 배치하고, 화면에서 직접 움직여 인트로 장면을 만듭니다.</p></div>
        <div className="editor-head-actions">
          <span className="autosave"><Save size={14} /> 자동 저장</span>
          {exportStatus === "rendering" ? (
            <button type="button" className="button secondary" onClick={cancelExport}><Square size={14} /> 생성 중지</button>
          ) : (
            <button type="button" className="button" onClick={() => void exportMp4()}><Download size={15} /> MP4 내보내기</button>
          )}
          <button type="button" className="button secondary" onClick={resetScene}><RotateCcw size={15} /> 초기화</button>
        </div>
      </div>

      {exportStatus !== "idle" && (
        <div className={`panel export-status ${exportStatus}`} role="status" aria-live="polite">
          <div className="export-status-copy">
            {exportStatus === "rendering" && <LoaderCircle className="spin" size={17} />}
            {exportStatus === "rendering" && <strong>MP4 생성 중 {exportProgress}%</strong>}
            {exportStatus === "complete" && <strong>MP4 저장이 완료되었습니다.</strong>}
            {exportStatus === "error" && <strong>MP4를 만들지 못했습니다.</strong>}
            <span>{exportStatus === "error" ? exportError : exportStatus === "rendering" ? "이 화면을 닫지 마세요. 영상 길이에 따라 시간이 걸릴 수 있습니다." : "브라우저의 다운로드 폴더에서 확인할 수 있습니다."}</span>
          </div>
          {exportStatus !== "error" && <div className="export-progress" aria-hidden="true"><i style={{ width: `${exportProgress}%` }} /></div>}
        </div>
      )}

      <div className="intro-editor-layout">
        <aside className="panel editor-assets">
          <div className="panel-head editor-assets-head"><h3>소재</h3><button type="button" className="button icon secondary" title="텍스트 추가" onClick={addText}><Type size={16} /></button></div>
          <div className="asset-source-tabs" aria-label="소재 종류">
            <button type="button" className={assetSource === "gallery" ? "active" : ""} onClick={() => setAssetSource("gallery")}><Images size={14} /> 갤러리</button>
            <button type="button" className={assetSource === "ai" ? "active" : ""} onClick={() => setAssetSource("ai")}><Sparkles size={14} /> AI 생성</button>
          </div>
          {assetSource === "gallery" ? (
            <>
              <div className="asset-tool-row"><button className="button secondary" type="button" onClick={addText}><Plus size={14} /> 텍스트</button></div>
              <div className="editor-asset-list">
                {assets.map((asset) => (
                  <article className="editor-asset" key={asset.id}>
                    <div className="editor-asset-thumb"><Image src={asset.url} alt={asset.title} fill sizes="150px" unoptimized /></div>
                    <strong>{asset.title}</strong>
                    <div className="editor-asset-actions">
                      <button type="button" title="배경으로 사용" onClick={() => addAsset(asset, "background")}><ImageIcon size={15} /></button>
                      <button type="button" title="요소로 추가" onClick={() => addAsset(asset, "image")}><UserRoundPlus size={15} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : <IntroAiAssets assets={assets} onGenerated={addGeneratedAsset} />}
        </aside>

        <main className="editor-workspace">
          <div className="editor-toolbar panel">
            <div className="segmented" aria-label="편집 모드">
              <button type="button" className={mode === "edit" ? "active" : ""} onClick={() => setMode("edit")}><Layers3 size={14} /> 편집</button>
              <button type="button" className={mode === "preview" ? "active" : ""} onClick={() => setMode("preview")}><MonitorPlay size={14} /> 영상 미리보기</button>
            </div>
            <label>길이 <input type="range" min="3" max="12" step="1" value={scene.duration} onChange={(event) => setScene((current) => ({ ...current, duration: Number(event.target.value), elements: current.elements.map((element) => ({ ...element, end: Math.min(element.end, Number(event.target.value)) })) }))} /> <strong>{scene.duration}초</strong></label>
          </div>

          <div className="editor-canvas-shell panel" ref={canvasRef}>
            {mode === "preview" ? (
              <Player component={SceneComposition} inputProps={{ scene }} durationInFrames={frames} compositionWidth={1920} compositionHeight={1080} fps={30} controls loop style={{ width: "100%", aspectRatio: "16 / 9", background: scene.backgroundColor }} />
            ) : (
              <div className="editor-stage" style={{ width: 1920 * scale, height: 1080 * scale, background: scene.backgroundColor }} onClick={() => setSelectedId(null)}>
                {[...scene.elements].sort((a, b) => a.zIndex - b.zIndex).map((element) => (
                  <Rnd
                    key={element.id}
                    bounds="parent"
                    size={{ width: element.width * scale, height: element.height * scale }}
                    position={{ x: element.x * scale, y: element.y * scale }}
                    disableDragging={element.type === "background"}
                    enableResizing={element.type === "background" ? false : undefined}
                    className={`scene-rnd ${selectedId === element.id ? "selected" : ""}`}
                    style={{ zIndex: element.zIndex, opacity: element.opacity }}
                    onClick={(event: ReactMouseEvent) => { event.stopPropagation(); setSelectedId(element.id); }}
                    onDragStop={(_, data) => updateElement(element.id, { x: Math.round(data.x / scale), y: Math.round(data.y / scale) })}
                    onResizeStop={(_, __, ref, ___, position) => updateElement(element.id, { width: Math.round(ref.offsetWidth / scale), height: Math.round(ref.offsetHeight / scale), x: Math.round(position.x / scale), y: Math.round(position.y / scale) })}
                  >
                    <div className="scene-element-content" style={{ transform: `rotate(${element.rotation}deg) scaleX(${element.flipX ? -1 : 1})` }}>
                      {element.type === "text" ? <div className="scene-text" style={{ color: element.color, fontSize: (element.fontSize ?? 80) * scale, fontWeight: element.fontWeight }}>{element.text}</div> : element.src ? <Image src={element.src} alt={element.name} fill sizes="50vw" unoptimized draggable={false} style={{ objectFit: element.type === "background" ? "cover" : "contain", filter: sceneImageFilter(element) }} /> : null}
                    </div>
                  </Rnd>
                ))}
              </div>
            )}
          </div>

          <section className="panel editor-timeline">
            <div className="panel-head"><h3>타임라인</h3><span className="chip">{scene.duration}초</span></div>
            <div className="timeline-body">
              {orderedElements.map((element) => (
                <button type="button" key={element.id} className={`timeline-row ${selectedId === element.id ? "active" : ""}`} onClick={() => { setSelectedId(element.id); setMode("edit"); }}>
                  <span>{element.name}</span>
                  <span className="timeline-track"><i style={{ left: `${(element.start / scene.duration) * 100}%`, width: `${Math.max(2, ((element.end - element.start) / scene.duration) * 100)}%` }} /></span>
                </button>
              ))}
            </div>
          </section>
        </main>

        <aside className="panel editor-inspector">
          <div className="panel-head"><h3>속성</h3>{selected && <div className="layer-actions"><button type="button" title="앞으로" onClick={() => moveLayer(1)}><ArrowUp size={14} /></button><button type="button" title="뒤로" onClick={() => moveLayer(-1)}><ArrowDown size={14} /></button></div>}</div>
          <div className="panel-body">
            {!selected && <div className="source-empty inspector-empty">화면이나 타임라인에서 요소를 선택하세요.</div>}
            {selected && (
              <>
                <div className="field"><label className="label">요소 이름</label><input className="input" value={selected.name} onChange={(event) => updateElement(selected.id, { name: event.target.value })} /></div>
                {selected.type === "text" && <><div className="field"><label className="label">문구</label><textarea className="textarea" value={selected.text} onChange={(event) => updateElement(selected.id, { text: event.target.value })} /></div><div className="field-row"><div className="field"><label className="label">글자색</label><input className="input color-control" type="color" value={selected.color} onChange={(event) => updateElement(selected.id, { color: event.target.value })} /></div><div className="field"><label className="label">글자 크기</label><input className="input" type="number" min="24" max="180" value={selected.fontSize} onChange={(event) => updateElement(selected.id, { fontSize: Number(event.target.value) })} /></div></div></>}
                <div className="field"><label className="label">등장 효과</label><select className="select" value={selected.animation} onChange={(event) => updateElement(selected.id, { animation: event.target.value as SceneAnimation })}>{Object.entries(animationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div className="field-row"><div className="field"><label className="label">시작</label><input className="input" type="number" min="0" max={scene.duration} step="0.1" value={selected.start} onChange={(event) => updateElement(selected.id, { start: Math.min(Number(event.target.value), selected.end) })} /></div><div className="field"><label className="label">종료</label><input className="input" type="number" min="0" max={scene.duration} step="0.1" value={selected.end} onChange={(event) => updateElement(selected.id, { end: Math.max(Number(event.target.value), selected.start) })} /></div></div>
                <div className="field"><label className="label">투명도 · {Math.round(selected.opacity * 100)}%</label><input className="range" type="range" min="0.1" max="1" step="0.05" value={selected.opacity} onChange={(event) => updateElement(selected.id, { opacity: Number(event.target.value) })} /></div>
                {selected.type !== "text" && <><div className="field"><label className="label">밝기 · {selected.brightness ?? 100}%</label><input className="range" type="range" min="40" max="160" step="5" value={selected.brightness ?? 100} onChange={(event) => updateElement(selected.id, { brightness: Number(event.target.value) })} /></div><div className="field"><label className="label">흐림 · {selected.blur ?? 0}px</label><input className="range" type="range" min="0" max="20" step="1" value={selected.blur ?? 0} onChange={(event) => updateElement(selected.id, { blur: Number(event.target.value) })} /></div></>}
                {selected.type !== "background" && <div className="field"><label className="label">회전 · {selected.rotation}°</label><input className="range" type="range" min="-30" max="30" step="1" value={selected.rotation} onChange={(event) => updateElement(selected.id, { rotation: Number(event.target.value) })} /></div>}
                {(selected.type === "image" || selected.type === "logo") && <><button type="button" className={`button secondary flip-control ${selected.flipX ? "active" : ""}`} onClick={() => updateElement(selected.id, { flipX: !selected.flipX })}><FlipHorizontal2 size={15} /> 좌우 반전</button><div className="field"><label className="label">외곽선 · {selected.outlineWidth ?? 0}px</label><input className="range" type="range" min="0" max="14" step="1" value={selected.outlineWidth ?? 0} onChange={(event) => updateElement(selected.id, { outlineWidth: Number(event.target.value) })} /></div><div className="field"><label className="label">외곽선 색상</label><input className="input color-control" type="color" value={selected.outlineColor ?? "#ffffff"} onChange={(event) => updateElement(selected.id, { outlineColor: event.target.value })} /></div><div className="field"><label className="label">그림자 · {selected.shadow ?? 0}px</label><input className="range" type="range" min="0" max="40" step="2" value={selected.shadow ?? 0} onChange={(event) => updateElement(selected.id, { shadow: Number(event.target.value) })} /></div></>}
                <button type="button" className="button danger" onClick={removeSelected}><Trash2 size={15} /> 요소 삭제</button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
