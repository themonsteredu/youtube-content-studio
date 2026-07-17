"use client";

import { Image as ImageIcon, LoaderCircle, Settings2, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readApiSecret, readApiSettings, type ApiSettings } from "@/lib/client-settings";
import { saveLocalAsset } from "@/lib/local-media";
import type { MediaAsset } from "@/types/studio";

const backgrounds = [
  ["교실·학원", "modern Korean academy classroom, warm daylight, tidy desks and whiteboard"],
  ["촬영 스튜디오", "bright professional creator studio with soft lights and education props"],
  ["칠판·화이트보드", "clean whiteboard and classroom wall with subtle education objects"],
  ["뉴스·인터뷰", "professional education news interview studio, modern and trustworthy"],
  ["밝은 교육", "colorful optimistic education content set, clean and sophisticated"],
  ["긴급·경고", "urgent announcement set with restrained red warning accents"],
  ["성과·축하", "education achievement celebration set with tasteful confetti and awards"],
  ["계절·행사", "seasonal school event setting, festive but uncluttered"],
  ["단색·패턴", "graphic studio background with clean geometric pattern and strong contrast"],
] as const;

const poses = [
  ["밝게 미소", "smiling warmly at the camera"],
  ["놀란 표정", "surprised expression with both hands reacting naturally"],
  ["한쪽 가리키기", "pointing clearly to the empty space on the left"],
  ["설명하는 손짓", "explaining with open hands like a confident teacher"],
  ["엄지 척", "giving a natural thumbs-up toward the camera"],
  ["생각하는 표정", "thoughtful expression with one hand near the chin"],
  ["팔짱", "confidently crossing arms with a friendly expression"],
  ["옆모습", "three-quarter side profile looking toward the empty title space"],
] as const;

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function normalizeReference(source: string) {
  const image = await loadImage(source);
  const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

async function removeGreenBackground(source: string) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return source;
  context.drawImage(image, 0, 0);
  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = frame.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const greenLead = green - Math.max(red, blue);
    if (green > 80 && greenLead > 14) {
      const opacity = 1 - Math.min(1, Math.max(0, (greenLead - 14) / 90));
      pixels[index + 3] = Math.round(255 * opacity);
      pixels[index + 1] = Math.min(green, Math.max(red, blue));
    }
  }
  context.putImageData(frame, 0, 0);
  return canvas.toDataURL("image/png");
}

export function IntroAiAssets({ assets, onGenerated }: { assets: MediaAsset[]; onGenerated: (asset: MediaAsset, type: "background" | "image") => void }) {
  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [kind, setKind] = useState<"background" | "portrait">("background");
  const [background, setBackground] = useState(backgrounds[0]);
  const [pose, setPose] = useState(poses[0]);
  const [referenceId, setReferenceId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const references = useMemo(() => [...assets].sort((a, b) => {
    const localPriority = Number(b.url.startsWith("data:")) - Number(a.url.startsWith("data:"));
    if (localPriority) return localPriority;
    const portraitPriority = Number(b.category === "portrait") - Number(a.category === "portrait");
    return portraitPriority || b.createdAt.localeCompare(a.createdAt);
  }), [assets]);

  useEffect(() => {
    const sync = () => setSettings(readApiSettings());
    sync();
    window.addEventListener("youtube-studio:api-settings-changed", sync);
    return () => window.removeEventListener("youtube-studio:api-settings-changed", sync);
  }, []);

  const apiReady = settings?.enabled && settings.provider === "openai";
  const selectedReferenceId = referenceId || references[0]?.id || "";

  async function generate() {
    if (!settings) return;
    const apiKey = readApiSecret(settings.rememberKey);
    if (!apiReady || !apiKey) {
      setMessage("설정에서 OpenAI API를 켜고 키를 저장하세요.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const reference = references.find((asset) => asset.id === selectedReferenceId);
      const referenceImage = kind === "portrait" && reference ? await normalizeReference(reference.url) : undefined;
      if (kind === "portrait" && !referenceImage) throw new Error("기준 인물 사진을 선택하세요.");
      const preset = kind === "background" ? background[1] : pose[1];
      const response = await fetch("/api/ai-image", {
        method: "POST",
        headers: { "content-type": "application/json", "x-openai-api-key": apiKey },
        body: JSON.stringify({ kind, preset, prompt, referenceImage }),
      });
      const payload = await response.json() as { image?: string; error?: string };
      if (!response.ok || !payload.image) throw new Error(payload.error || "이미지를 생성하지 못했습니다.");

      const label = kind === "background" ? background[0] : pose[0];
      const url = kind === "portrait" ? await removeGreenBackground(payload.image) : payload.image;
      const asset: MediaAsset = {
        id: crypto.randomUUID(),
        title: `AI ${label}`,
        url,
        storagePath: `ai/${kind}/${Date.now()}`,
        category: kind === "background" ? "space" : "portrait",
        tags: ["AI", label],
        focalX: 50,
        focalY: 50,
        recommended: true,
        createdAt: new Date().toISOString(),
      };
      await saveLocalAsset(asset);
      onGenerated(asset, kind === "background" ? "background" : "image");
      setMessage("생성한 이미지를 장면과 갤러리에 저장했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 이미지를 생성하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-asset-panel">
      <div className="ai-mode-switch" aria-label="AI 이미지 종류">
        <button type="button" className={kind === "background" ? "active" : ""} onClick={() => setKind("background")}><ImageIcon size={14} /> 배경</button>
        <button type="button" className={kind === "portrait" ? "active" : ""} onClick={() => setKind("portrait")}><UserRound size={14} /> 인물 포즈</button>
      </div>

      <div className={`ai-api-badge ${apiReady ? "on" : ""}`}><span />{apiReady ? "OpenAI 연결됨" : "OpenAI 꺼짐"}</div>

      {kind === "portrait" && (
        <div className="ai-compact-field">
          <label htmlFor="ai-reference">기준 인물</label>
          <select id="ai-reference" className="select" value={selectedReferenceId} onChange={(event) => setReferenceId(event.target.value)}>
            {references.map((asset) => <option key={asset.id} value={asset.id}>{asset.title}</option>)}
          </select>
        </div>
      )}

      <div className="ai-preset-grid">
        {(kind === "background" ? backgrounds : poses).map((item) => {
          const active = kind === "background" ? item[0] === background[0] : item[0] === pose[0];
          return <button type="button" key={item[0]} className={active ? "active" : ""} onClick={() => kind === "background" ? setBackground(item as typeof background) : setPose(item as typeof pose)}>{item[0]}</button>;
        })}
      </div>

      <div className="ai-compact-field">
        <label htmlFor="ai-extra-prompt">추가 요청</label>
        <textarea id="ai-extra-prompt" className="textarea" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="의상, 색감, 소품 등" />
      </div>

      <button type="button" className="button ai-generate-button" disabled={busy || !apiReady || (kind === "portrait" && !selectedReferenceId)} onClick={() => void generate()}>
        {busy ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />} {busy ? "생성 중" : "AI 이미지 생성"}
      </button>
      {!apiReady && <Link className="ai-settings-link" href="/admin/settings"><Settings2 size={13} /> API 설정</Link>}
      {message && <p className="ai-asset-message" role="status">{message}</p>}
    </div>
  );
}
