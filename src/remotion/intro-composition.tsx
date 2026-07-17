import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { ContentDraft } from "@/types/studio";

export const defaultDraft: ContentDraft = {
  title: "AI 시대, 아이에게 정말 필요한 공부",
  subtitle: "별거 다하는 원장님의 교육 실험",
  episode: "EP. 12",
  imageUrl: "/demo/classroom.png",
  template: "bold",
  accent: "#f2c94c",
  textColor: "#ffffff",
  fontStyle: "strong",
  titleSize: 96,
  subtitleSize: 34,
  frameStyle: "corners",
  frameColor: "#ffffff",
  frameWidth: 8,
  frameInset: 48,
  decoration: "underline",
  overlayOpacity: 0.7,
  imageZoom: 1.04,
  duration: 6,
};

export function IntroComposition({ title, subtitle, episode, imageUrl, accent }: ContentDraft) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const photo = imageUrl.startsWith("/") ? staticFile(imageUrl.slice(1)) : imageUrl;
  const scale = interpolate(frame, [0, fps * 6], [1.04, 1.12], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#101114", fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      <Img src={photo} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(8,9,12,.92), rgba(8,9,12,.2) 75%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", padding: 110, transform: `translateY(${(1 - enter) * 45}px)`, opacity: enter }}>
        <div style={{ color: "#151515", background: accent, alignSelf: "flex-start", padding: "10px 18px", fontSize: 26, fontWeight: 800 }}>{episode}</div>
        <div style={{ color: "white", maxWidth: 1150, fontSize: 78, lineHeight: 1.1, fontWeight: 900, marginTop: 24, wordBreak: "keep-all" }}>{title}</div>
        <div style={{ color: "rgba(255,255,255,.76)", fontSize: 32, marginTop: 24 }}>{subtitle}</div>
        <div style={{ width: interpolate(frame, [8, 38], [0, 280], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), height: 8, background: accent, marginTop: 38 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
