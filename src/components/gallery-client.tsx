"use client";

import { Search, Star, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { listLocalAssets, mergeAssets, saveLocalAsset } from "@/lib/local-media";
import type { MediaAsset } from "@/types/studio";

const categoryNames = { class: "수업", activity: "활동", portrait: "인물", space: "공간" };

export function GalleryClient({ initialAssets }: { initialAssets: MediaAsset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [localReady, setLocalReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const visible = useMemo(() => assets.filter((item) => `${item.title} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [assets, query]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      listLocalAssets()
        .then((localAssets) => setAssets((current) => mergeAssets(localAssets, current)))
        .catch(() => undefined)
        .finally(() => setLocalReady(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!localReady) return;
    const uploads = assets.filter((asset) => asset.url.startsWith("data:") && !asset.storagePath.startsWith("demo/"));
    void Promise.all(uploads.map((asset) => saveLocalAsset(asset))).catch(() => undefined);
  }, [assets, localReady]);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    form.set("title", file.name.replace(/\.[^.]+$/, ""));
    form.set("category", "activity");
    const response = await fetch("/api/assets", { method: "POST", body: form });
    const payload = await response.json();
    if (response.ok) {
      const asset = payload.asset as MediaAsset;
      await saveLocalAsset(asset);
      setAssets((current) => mergeAssets([asset], current));
    }
    else window.alert(payload.error ?? "업로드에 실패했습니다.");
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <div className="page-head">
        <div><h2>이미지 갤러리</h2><p>썸네일과 인트로에 사용할 사진을 관리합니다.</p></div>
        <label className="button" aria-disabled={busy}>
          <Upload size={16} /> {busy ? "업로드 중" : "이미지 업로드"}
          <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => upload(event.target.files?.[0])} />
        </label>
      </div>
      <section className="panel">
        <div className="panel-head">
          <h3>등록 이미지 <span className="chip">{visible.length}</span></h3>
          <div className="gallery-tools"><div style={{ position: "relative" }}><Search size={15} style={{ position: "absolute", left: 11, top: 12, color: "#69707d" }} /><input className="input" style={{ paddingLeft: 34 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목 또는 태그 검색" /></div></div>
        </div>
        <div className="panel-body">
          <div className="image-grid">
            {visible.map((asset) => (
              <article className="panel image-card" key={asset.id}>
                <figure><Image src={asset.url} alt={asset.title} fill sizes="(max-width: 760px) 50vw, (max-width: 1050px) 33vw, 25vw" unoptimized style={{ objectFit: "cover", objectPosition: `${asset.focalX}% ${asset.focalY}%` }} />{asset.recommended && <span className="status ready" style={{ position: "absolute", top: 9, right: 9 }}><Star size={10} fill="currentColor" /> 추천</span>}</figure>
                <div className="image-info"><strong>{asset.title}</strong><p>{categoryNames[asset.category]} · {asset.tags.join(" · ")}</p></div>
              </article>
            ))}
          </div>
          {!visible.length && <div className="empty">조건에 맞는 이미지가 없습니다.</div>}
        </div>
      </section>
    </>
  );
}
