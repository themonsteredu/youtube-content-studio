"use client";

import { ArrowDown, ArrowUp, Circle, ImagePlus, Minus, RotateCcw, Square, Trash2, Type } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Rnd } from "react-rnd";
import { ThumbnailBackdrop, thumbnailFontFamilies, thumbnailFontWeights } from "@/components/thumbnail-preview";
import type { ContentDraft, MediaAsset, ThumbnailElement, ThumbnailElementType } from "@/types/studio";

function textElement(id: string, name: string, role: ThumbnailElement["role"], text: string, x: number, y: number, width: number, height: number, draft: ContentDraft, fontSize: number, zIndex: number): ThumbnailElement {
  return { id, name, role, type: "text", text, x, y, width, height, rotation: 0, opacity: 1, zIndex, color: role === "episode" ? "#151515" : draft.textColor, backgroundColor: role === "episode" ? draft.accent : "transparent", borderColor: "#ffffff", borderWidth: 0, borderRadius: 0, fontStyle: draft.fontStyle, fontSize, fontWeight: thumbnailFontWeights[draft.fontStyle] };
}

export function createDefaultThumbnailElements(draft: ContentDraft): ThumbnailElement[] {
  if (draft.template === "documentary") {
    return [
      textElement("thumb-episode", "회차", "episode", draft.episode || "NEW", 140, 370, 260, 68, draft, 30, 3),
      textElement("thumb-title", "메인 제목", "title", draft.title, 140, 455, 1160, 250, draft, draft.titleSize, 2),
      textElement("thumb-subtitle", "부제", "subtitle", draft.subtitle, 140, 720, 920, 70, draft, draft.subtitleSize, 1),
    ];
  }
  if (draft.template === "clean") {
    return [
      textElement("thumb-episode", "회차", "episode", draft.episode || "NEW", 120, 700, 240, 68, draft, 30, 3),
      textElement("thumb-title", "메인 제목", "title", draft.title, 120, 785, 1450, 150, draft, draft.titleSize, 2),
      textElement("thumb-subtitle", "부제", "subtitle", draft.subtitle, 120, 945, 1050, 60, draft, draft.subtitleSize, 1),
    ];
  }
  return [
    textElement("thumb-episode", "회차", "episode", draft.episode || "NEW", 120, 690, 240, 68, draft, 30, 3),
    textElement("thumb-title", "메인 제목", "title", draft.title, 120, 775, 1640, 150, draft, draft.titleSize, 2),
    textElement("thumb-subtitle", "부제", "subtitle", draft.subtitle, 120, 940, 1100, 60, draft, draft.subtitleSize, 1),
  ];
}

function ElementContent({ element, scale }: { element: ThumbnailElement; scale: number }) {
  const common = { transform: `rotate(${element.rotation}deg)`, opacity: element.opacity };
  if (element.type === "text") {
    const fontStyle = element.fontStyle ?? "strong";
    return (
      <div className="thumbnail-element-text" style={{ ...common, color: element.color, background: element.backgroundColor, border: `${(element.borderWidth ?? 0) * scale}px solid ${element.borderColor ?? "transparent"}`, borderRadius: (element.borderRadius ?? 0) * scale, fontFamily: thumbnailFontFamilies[fontStyle], fontSize: (element.fontSize ?? 72) * scale, fontWeight: element.fontWeight ?? thumbnailFontWeights[fontStyle] }}>
        {element.text}
      </div>
    );
  }
  if (element.type === "image" && element.src) {
    return <div className="thumbnail-element-image" style={common}><Image src={element.src} alt={element.name} fill sizes="40vw" unoptimized draggable={false} /></div>;
  }
  return <div className={`thumbnail-element-shape shape-${element.type}`} style={{ ...common, background: element.backgroundColor, border: element.type === "line" ? 0 : `${(element.borderWidth ?? 0) * scale}px solid ${element.borderColor ?? "transparent"}`, borderRadius: element.type === "circle" ? "50%" : (element.borderRadius ?? 0) * scale }} />;
}

type ThumbnailLayoutEditorProps = {
  draft: ContentDraft;
  elements: ThumbnailElement[];
  assets: MediaAsset[];
  onChange: (elements: ThumbnailElement[]) => void;
};

export function ThumbnailLayoutEditor({ draft, elements, assets, onChange }: ThumbnailLayoutEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(elements.find((element) => element.role === "title")?.id ?? null);
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const [scale, setScale] = useState(0.5);
  const canvasRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => elements.find((element) => element.id === selectedId) ?? null, [elements, selectedId]);
  const ordered = useMemo(() => [...elements].sort((a, b) => b.zIndex - a.zIndex), [elements]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(entry.contentRect.width / 1920, 1)));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function updateElement(id: string, patch: Partial<ThumbnailElement>) {
    onChange(elements.map((element) => element.id === id ? { ...element, ...patch } : element));
  }

  function addElement(type: Exclude<ThumbnailElementType, "image">) {
    const top = Math.max(0, ...elements.map((element) => element.zIndex)) + 1;
    const base: ThumbnailElement = { id: crypto.randomUUID(), name: type === "text" ? "추가 텍스트" : type === "rectangle" ? "사각형" : type === "circle" ? "원" : "선", type, role: "custom", x: 760, y: 440, width: type === "line" ? 520 : 360, height: type === "line" ? 14 : type === "text" ? 110 : 220, rotation: 0, opacity: 1, zIndex: top, backgroundColor: type === "text" ? "transparent" : draft.accent, borderColor: "#ffffff", borderWidth: type === "line" ? 0 : 3, borderRadius: type === "rectangle" ? 8 : 0 };
    const next = type === "text" ? { ...base, text: "새 문구를 입력하세요", color: draft.textColor, fontStyle: draft.fontStyle, fontSize: 64, fontWeight: thumbnailFontWeights[draft.fontStyle] } : base;
    onChange([...elements, next]);
    setSelectedId(next.id);
  }

  function addImage() {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const top = Math.max(0, ...elements.map((element) => element.zIndex)) + 1;
    const next: ThumbnailElement = { id: crypto.randomUUID(), name: asset.title, type: "image", role: "custom", src: asset.url, x: 1260, y: 180, width: 520, height: 720, rotation: 0, opacity: 1, zIndex: top };
    onChange([...elements, next]);
    setSelectedId(next.id);
  }

  function removeSelected() {
    if (!selected) return;
    onChange(elements.filter((element) => element.id !== selected.id));
    setSelectedId(null);
  }

  function moveLayer(direction: 1 | -1) {
    if (!selected) return;
    updateElement(selected.id, { zIndex: Math.max(0, selected.zIndex + direction) });
  }

  function resetLayout() {
    if (!window.confirm("현재 썸네일 요소 배치를 초기화할까요?")) return;
    const next = createDefaultThumbnailElements(draft);
    onChange(next);
    setSelectedId(next.find((element) => element.role === "title")?.id ?? null);
  }

  return (
    <div className="thumbnail-layout-editor">
      <div className="thumbnail-tool-row">
        <button type="button" className="button secondary" onClick={() => addElement("text")}><Type size={14} /> 텍스트</button>
        <button type="button" className="button secondary" onClick={() => addElement("rectangle")}><Square size={14} /> 사각형</button>
        <button type="button" className="button secondary" onClick={() => addElement("circle")}><Circle size={14} /> 원</button>
        <button type="button" className="button secondary" onClick={() => addElement("line")}><Minus size={14} /> 선</button>
        <div className="thumbnail-image-tool"><select className="select" value={assetId} onChange={(event) => setAssetId(event.target.value)}>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.title}</option>)}</select><button type="button" className="button secondary" disabled={!assetId} onClick={addImage}><ImagePlus size={14} /> 이미지</button></div>
        <button type="button" className="button icon secondary" title="배치 초기화" onClick={resetLayout}><RotateCcw size={15} /></button>
      </div>

      <div className="thumbnail-canvas-shell" ref={canvasRef}>
        <div className={`thumb-stage thumb-template-${draft.template} thumbnail-free-stage`} style={{ width: 1920 * scale, height: 1080 * scale, backgroundImage: `url(${draft.imageUrl})`, backgroundSize: `${draft.imageZoom * 100}%`, color: draft.textColor, fontFamily: thumbnailFontFamilies[draft.fontStyle] }} onClick={() => setSelectedId(null)}>
          <ThumbnailBackdrop draft={draft} />
          {[...elements].sort((a, b) => a.zIndex - b.zIndex).map((element) => (
            <Rnd
              key={element.id}
              bounds="parent"
              size={{ width: element.width * scale, height: element.height * scale }}
              position={{ x: element.x * scale, y: element.y * scale }}
              minWidth={40 * scale}
              minHeight={element.type === "line" ? 6 * scale : 28 * scale}
              className={`thumbnail-rnd ${selectedId === element.id ? "selected" : ""}`}
              style={{ zIndex: element.zIndex + 5 }}
              onClick={(event: ReactMouseEvent) => { event.stopPropagation(); setSelectedId(element.id); }}
              onDragStop={(_, data) => updateElement(element.id, { x: Math.round(data.x / scale), y: Math.round(data.y / scale) })}
              onResizeStop={(_, __, ref, ___, position) => updateElement(element.id, { width: Math.round(ref.offsetWidth / scale), height: Math.round(ref.offsetHeight / scale), x: Math.round(position.x / scale), y: Math.round(position.y / scale) })}
            >
              <ElementContent element={element} scale={scale} />
            </Rnd>
          ))}
        </div>
      </div>

      <div className="thumbnail-editor-bottom">
        <div className="thumbnail-layer-list" aria-label="썸네일 요소 목록">
          <strong>요소</strong>
          {ordered.map((element) => <button type="button" key={element.id} className={selectedId === element.id ? "active" : ""} onClick={() => setSelectedId(element.id)}><span>{element.name}</span><small>{element.type}</small></button>)}
        </div>
        <div className="thumbnail-inspector">
          {!selected && <div className="source-empty">편집할 요소를 선택하세요.</div>}
          {selected && (
            <>
              <div className="thumbnail-inspector-head"><strong>{selected.name}</strong><div className="layer-actions"><button type="button" title="앞으로" onClick={() => moveLayer(1)}><ArrowUp size={14} /></button><button type="button" title="뒤로" onClick={() => moveLayer(-1)}><ArrowDown size={14} /></button></div></div>
              <div className="coordinate-grid">
                <label>X<input className="input" type="number" value={selected.x} onChange={(event) => updateElement(selected.id, { x: Number(event.target.value) })} /></label>
                <label>Y<input className="input" type="number" value={selected.y} onChange={(event) => updateElement(selected.id, { y: Number(event.target.value) })} /></label>
                <label>너비<input className="input" type="number" min="20" value={selected.width} onChange={(event) => updateElement(selected.id, { width: Number(event.target.value) })} /></label>
                <label>높이<input className="input" type="number" min="6" value={selected.height} onChange={(event) => updateElement(selected.id, { height: Number(event.target.value) })} /></label>
              </div>
              {selected.type === "text" && <><div className="field"><label className="label">문구</label><textarea className="textarea" value={selected.text ?? ""} onChange={(event) => updateElement(selected.id, { text: event.target.value })} /></div><div className="field-row"><div className="field"><label className="label">글꼴</label><select className="select" value={selected.fontStyle ?? "strong"} onChange={(event) => updateElement(selected.id, { fontStyle: event.target.value as ContentDraft["fontStyle"], fontWeight: undefined })}><option value="strong">굵은 고딕</option><option value="rounded">부드러운 고딕</option><option value="serif">명조</option><option value="modern">모던 고딕</option></select></div><div className="field"><label className="label">글자 크기</label><input className="input" type="number" min="16" max="180" value={selected.fontSize ?? 64} onChange={(event) => updateElement(selected.id, { fontSize: Number(event.target.value) })} /></div></div><div className="field-row"><div className="field"><label className="label">글자색</label><input className="input color-control" type="color" value={selected.color ?? "#ffffff"} onChange={(event) => updateElement(selected.id, { color: event.target.value })} /></div><div className="field"><label className="label">배경색</label><input className="input color-control" type="color" value={selected.backgroundColor === "transparent" ? "#000000" : selected.backgroundColor ?? "#000000"} onChange={(event) => updateElement(selected.id, { backgroundColor: event.target.value })} />{selected.backgroundColor !== "transparent" && <button type="button" className="inline-reset" onClick={() => updateElement(selected.id, { backgroundColor: "transparent" })}>배경 없음</button>}</div></div></>}
              {(selected.type === "rectangle" || selected.type === "circle" || selected.type === "line") && <><div className="field-row"><div className="field"><label className="label">채우기</label><input className="input color-control" type="color" value={selected.backgroundColor ?? draft.accent} onChange={(event) => updateElement(selected.id, { backgroundColor: event.target.value })} /></div>{selected.type !== "line" && <div className="field"><label className="label">테두리</label><input className="input color-control" type="color" value={selected.borderColor ?? "#ffffff"} onChange={(event) => updateElement(selected.id, { borderColor: event.target.value })} /></div>}</div>{selected.type !== "line" && <div className="field"><label className="label range-label">테두리 두께 <output>{selected.borderWidth ?? 0}px</output></label><input className="range" type="range" min="0" max="30" value={selected.borderWidth ?? 0} onChange={(event) => updateElement(selected.id, { borderWidth: Number(event.target.value) })} /></div>}{selected.type === "rectangle" && <div className="field"><label className="label range-label">모서리 <output>{selected.borderRadius ?? 0}px</output></label><input className="range" type="range" min="0" max="80" value={selected.borderRadius ?? 0} onChange={(event) => updateElement(selected.id, { borderRadius: Number(event.target.value) })} /></div>}</>}
              <div className="field"><label className="label range-label">투명도 <output>{Math.round(selected.opacity * 100)}%</output></label><input className="range" type="range" min="0.1" max="1" step="0.05" value={selected.opacity} onChange={(event) => updateElement(selected.id, { opacity: Number(event.target.value) })} /></div>
              <div className="field"><label className="label range-label">회전 <output>{selected.rotation}°</output></label><input className="range" type="range" min="-180" max="180" step="1" value={selected.rotation} onChange={(event) => updateElement(selected.id, { rotation: Number(event.target.value) })} /></div>
              <button type="button" className="button danger" onClick={removeSelected}><Trash2 size={14} /> 요소 삭제</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
