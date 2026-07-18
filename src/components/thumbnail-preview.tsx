import type { CSSProperties } from "react";
import type { ContentDraft } from "@/types/studio";

export const thumbnailFontFamilies: Record<ContentDraft["fontStyle"], string> = {
  strong: '"Thumbnail Strong", sans-serif',
  rounded: '"Thumbnail Soft", sans-serif',
  serif: '"Thumbnail Serif", serif',
  modern: '"Thumbnail Modern", sans-serif',
};

export const thumbnailFontWeights: Record<ContentDraft["fontStyle"], number> = { strong: 900, rounded: 700, serif: 800, modern: 500 };

function ThumbnailFrame({ draft }: { draft: ContentDraft }) {
  if (draft.frameStyle === "none") return null;
  const style = {
    inset: `${draft.frameInset / 19.2}cqw`,
    borderColor: draft.frameColor,
    borderWidth: `${draft.frameWidth / 19.2}cqw`,
  } as CSSProperties;

  if (draft.frameStyle === "corners") {
    return <div className="thumb-frame thumb-frame-corners" style={style} aria-hidden="true"><i /><i /><i /><i /></div>;
  }
  return <div className={`thumb-frame thumb-frame-${draft.frameStyle}`} style={style} aria-hidden="true" />;
}

function ThumbnailDecoration({ draft }: { draft: ContentDraft }) {
  if (draft.decoration === "none") return null;
  if (draft.decoration === "dots") {
    return <div className="thumb-decor thumb-decor-dots" style={{ color: draft.accent }} aria-hidden="true"><i /><i /><i /></div>;
  }
  return <div className={`thumb-decor thumb-decor-${draft.decoration}`} style={{ color: draft.accent, borderColor: draft.accent, backgroundColor: draft.decoration === "side" ? draft.accent : undefined }} aria-hidden="true" />;
}

export function ThumbnailBackdrop({ draft }: { draft: ContentDraft }) {
  return (
    <>
      <div className="thumb-photo-overlay" style={{ opacity: draft.overlayOpacity }} aria-hidden="true" />
      <ThumbnailFrame draft={draft} />
      <ThumbnailDecoration draft={draft} />
    </>
  );
}

export function ThumbnailPreview({ draft }: { draft: ContentDraft }) {
  const stageStyle = {
    backgroundImage: `url(${draft.imageUrl})`,
    backgroundSize: `${draft.imageZoom * 100}%`,
    color: draft.textColor,
    fontFamily: thumbnailFontFamilies[draft.fontStyle],
  };

  return (
    <div className="preview-frame">
      <div className={`thumb-stage thumb-template-${draft.template}`} style={stageStyle}>
        <ThumbnailBackdrop draft={draft} />
        <div className="thumb-copy">
          <span className="thumb-kicker" style={{ backgroundColor: draft.accent }}>{draft.episode || "NEW"}</span>
          <div className="thumb-title" style={{ fontSize: `${draft.titleSize / 19.2}cqw`, fontWeight: thumbnailFontWeights[draft.fontStyle] }}>{draft.title || "제목을 입력하세요"}</div>
          {draft.decoration === "underline" && <div className="thumb-title-line" style={{ backgroundColor: draft.accent }} aria-hidden="true" />}
          {draft.subtitle && <div className="thumb-subtitle" style={{ fontSize: `${draft.subtitleSize / 19.2}cqw` }}>{draft.subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
