import { ImageResponse } from "next/og";
import { z } from "zod";
import { assertAdminApi, authErrorResponse } from "@/lib/auth-api";

export const runtime = "nodejs";
export const maxDuration = 60;

const thumbnailElementInput = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  type: z.enum(["text", "rectangle", "circle", "line", "image"]),
  role: z.enum(["title", "subtitle", "episode", "custom"]).optional(),
  x: z.number().min(-1920).max(3840),
  y: z.number().min(-1080).max(2160),
  width: z.number().min(2).max(3840),
  height: z.number().min(2).max(2160),
  rotation: z.number().min(-360).max(360),
  opacity: z.number().min(0).max(1),
  zIndex: z.number().min(0).max(1000),
  text: z.string().max(200).optional(),
  src: z.string().max(12_000_000).optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().min(0).max(80).optional(),
  borderRadius: z.number().min(0).max(500).optional(),
  fontStyle: z.enum(["strong", "rounded", "serif", "modern"]).optional(),
  fontSize: z.number().min(8).max(300).optional(),
  fontWeight: z.number().min(100).max(900).optional(),
});

const input = z.object({
  title: z.string().min(2).max(60),
  subtitle: z.string().max(80),
  episode: z.string().max(20),
  imageUrl: z.string(),
  template: z.enum(["bold", "documentary", "clean"]).default("bold"),
  accent: z.string().default("#f2c94c"),
  textColor: z.string().default("#ffffff"),
  fontStyle: z.enum(["strong", "rounded", "serif", "modern"]).default("strong"),
  titleSize: z.number().min(56).max(132).default(104),
  subtitleSize: z.number().min(20).max(52).default(34),
  frameStyle: z.enum(["none", "solid", "double", "corners"]).default("corners"),
  frameColor: z.string().default("#ffffff"),
  frameWidth: z.number().min(2).max(18).default(8),
  frameInset: z.number().min(20).max(100).default(48),
  decoration: z.enum(["none", "underline", "side", "dots", "circle"]).default("underline"),
  overlayOpacity: z.number().min(0.15).max(0.95).default(0.7),
  imageZoom: z.number().min(1).max(1.3).default(1.04),
  thumbnailElements: z.array(thumbnailElementInput).max(30).optional(),
});

type ThumbnailInput = z.infer<typeof input>;
type ThumbnailElementInput = z.infer<typeof thumbnailElementInput>;

const fontFiles: Record<ThumbnailInput["fontStyle"], string> = {
  strong: "NotoSansKR-900.ttf",
  rounded: "NotoSansKR-700.ttf",
  serif: "NotoSerifKR-800.ttf",
  modern: "NotoSansKR-500.ttf",
};

const fontWeights: Record<ThumbnailInput["fontStyle"], 500 | 700 | 800 | 900> = {
  strong: 900,
  rounded: 700,
  serif: 800,
  modern: 500,
};

const fontCache = new Map<string, Promise<ArrayBuffer>>();

function loadFont(request: Request, style: ThumbnailInput["fontStyle"]) {
  const url = new URL(`/fonts/${fontFiles[style]}`, request.url).toString();
  const cached = fontCache.get(url);
  if (cached) return cached;
  const pending = fetch(url, { cache: "force-cache" }).then((response) => {
    if (!response.ok) throw new Error("THUMBNAIL_FONT_LOAD_FAILED");
    return response.arrayBuffer();
  });
  fontCache.set(url, pending);
  return pending;
}

function renderThumbnailElement(element: ThumbnailElementInput, request: Request) {
  const style = element.fontStyle ?? "strong";
  const common = {
    position: "absolute" as const,
    zIndex: element.zIndex + 5,
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    display: "flex",
    opacity: element.opacity,
    transform: `rotate(${element.rotation}deg)`,
  };
  if (element.type === "text") {
    const hasBackground = Boolean(element.backgroundColor && element.backgroundColor !== "transparent");
    return <div key={element.id} style={{ ...common, alignItems: "center", padding: hasBackground ? "0 20px" : 0, color: element.color ?? "#ffffff", background: element.backgroundColor ?? "transparent", border: `${element.borderWidth ?? 0}px solid ${element.borderColor ?? "transparent"}`, borderRadius: element.borderRadius ?? 0, fontFamily: `ThumbnailFont-${style}`, fontSize: element.fontSize ?? 64, fontWeight: element.fontWeight ?? fontWeights[style], lineHeight: 1.05, whiteSpace: "pre-wrap", wordBreak: "keep-all", overflow: "hidden" }}>{element.text ?? ""}</div>;
  }
  if (element.type === "image" && element.src) {
    const source = element.src.startsWith("/") ? new URL(element.src, request.url).toString() : element.src;
    return <div key={element.id} style={{ ...common, overflow: "hidden" }}>
      {/* ImageResponse renders HTML-compatible elements rather than next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={source} alt="" width={element.width} height={element.height} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>;
  }
  return <div key={element.id} style={{ ...common, background: element.backgroundColor ?? "transparent", border: element.type === "line" ? 0 : `${element.borderWidth ?? 0}px solid ${element.borderColor ?? "transparent"}`, borderRadius: element.type === "circle" ? "50%" : element.borderRadius ?? 0 }} />;
}

function ThumbnailFrame({ draft }: { draft: ThumbnailInput }) {
  if (draft.frameStyle === "none") return null;
  const common = { position: "absolute" as const, zIndex: 3, top: draft.frameInset, right: draft.frameInset, bottom: draft.frameInset, left: draft.frameInset, display: "flex" };
  if (draft.frameStyle !== "corners") {
    return <div style={{ ...common, border: `${draft.frameWidth}px ${draft.frameStyle === "double" ? "double" : "solid"} ${draft.frameColor}` }} />;
  }
  const size = 180;
  const corner = { position: "absolute" as const, display: "flex", width: size, height: size, borderColor: draft.frameColor, borderStyle: "solid", borderWidth: draft.frameWidth };
  return (
    <div style={{ ...common, borderColor: draft.frameColor }}>
      <div style={{ ...corner, left: 0, top: 0, borderRightWidth: 0, borderBottomWidth: 0 }} />
      <div style={{ ...corner, right: 0, top: 0, borderLeftWidth: 0, borderBottomWidth: 0 }} />
      <div style={{ ...corner, left: 0, bottom: 0, borderRightWidth: 0, borderTopWidth: 0 }} />
      <div style={{ ...corner, right: 0, bottom: 0, borderLeftWidth: 0, borderTopWidth: 0 }} />
    </div>
  );
}

function ThumbnailDecoration({ draft }: { draft: ThumbnailInput }) {
  if (draft.decoration === "none" || draft.decoration === "underline") return null;
  if (draft.decoration === "side") return <div style={{ position: "absolute", zIndex: 2, left: 72, top: 280, width: 14, height: 450, display: "flex", background: draft.accent }} />;
  if (draft.decoration === "circle") return <div style={{ position: "absolute", zIndex: 2, right: -80, top: 80, width: 520, height: 520, display: "flex", border: `11px solid ${draft.accent}`, borderRadius: "50%", opacity: 0.72 }} />;
  return (
    <div style={{ position: "absolute", zIndex: 2, right: 120, top: 100, display: "flex", gap: 16 }}>
      {[0, 1, 2].map((item) => <div key={item} style={{ width: 22, height: 22, display: "flex", borderRadius: "50%", background: draft.accent }} />)}
    </div>
  );
}

export async function POST(request: Request) {
  let draft: ThumbnailInput;
  try {
    await assertAdminApi();
    draft = input.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "썸네일 설정값을 확인하세요." }, { status: 400 });
    return authErrorResponse(error);
  }

  const imageUrl = draft.imageUrl.startsWith("/") ? new URL(draft.imageUrl, request.url).toString() : draft.imageUrl;
  const usedFontStyles = [...new Set([draft.fontStyle, ...(draft.thumbnailElements ?? []).filter((element) => element.type === "text").map((element) => element.fontStyle ?? draft.fontStyle)])];
  const loadedFonts = await Promise.all(usedFontStyles.map(async (style) => ({ style, data: await loadFont(request, style) })));
  const alpha = draft.overlayOpacity;
  const overlay = draft.template === "documentary"
    ? `linear-gradient(90deg, rgba(8,9,12,${alpha}) 0%, rgba(8,9,12,${alpha * 0.85}) 42%, rgba(8,9,12,0) 88%)`
    : `linear-gradient(0deg, rgba(8,9,12,${alpha}) 0%, rgba(8,9,12,${alpha * 0.7}) 35%, rgba(8,9,12,0) 78%)`;
  const copyPosition = draft.template === "documentary"
    ? { left: 140, top: 180, bottom: 180, maxWidth: 1220, justifyContent: "center" as const }
    : { left: 120, right: 120, bottom: 100, maxWidth: draft.template === "clean" ? 1400 : 1560, justifyContent: "flex-end" as const };

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", overflow: "hidden", backgroundColor: "#111", color: draft.textColor, fontFamily: `ThumbnailFont-${draft.fontStyle}` }}>
      {/* ImageResponse renders HTML-compatible elements rather than next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" width="1920" height="1080" style={{ position: "absolute", zIndex: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${draft.imageZoom})` }} />
      <div style={{ display: "flex", position: "absolute", zIndex: 1, inset: 0, background: overlay }} />
      <ThumbnailDecoration draft={draft} />
      <ThumbnailFrame draft={draft} />
      {draft.thumbnailElements?.length ? draft.thumbnailElements.map((element) => renderThumbnailElement(element, request)) : (
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", zIndex: 4, ...copyPosition }}>
          <div style={{ display: "flex", alignSelf: "flex-start", background: draft.accent, color: "#151515", padding: "10px 20px", fontSize: 30, fontWeight: 800 }}>{draft.episode || "NEW"}</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: draft.titleSize, lineHeight: draft.template === "documentary" ? 1.08 : 1.04, fontWeight: fontWeights[draft.fontStyle], wordBreak: "keep-all", textShadow: "0 5px 22px rgba(0,0,0,.38)" }}>{draft.title}</div>
          {draft.decoration === "underline" && <div style={{ display: "flex", width: 320, height: 9, marginTop: 24, background: draft.accent }} />}
          {draft.subtitle && <div style={{ display: "flex", marginTop: 20, fontSize: draft.subtitleSize, lineHeight: 1.25, fontWeight: 650, color: draft.textColor, opacity: 0.86, textShadow: "0 4px 16px rgba(0,0,0,.42)" }}>{draft.subtitle}</div>}
        </div>
      )}
    </div>,
    {
      width: 1920,
      height: 1080,
      fonts: loadedFonts.map(({ style, data }) => ({ name: `ThumbnailFont-${style}`, data, weight: fontWeights[style] })),
    },
  );
}
