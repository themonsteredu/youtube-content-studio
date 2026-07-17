import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";
import type { IntroScene, IntroSceneElement } from "@/types/studio";

export const defaultScene: IntroScene = {
  title: "새 인트로",
  duration: 6,
  backgroundColor: "#111318",
  elements: [
    {
      id: "default-title",
      type: "text",
      name: "메인 제목",
      text: "별거 다하는 원장님",
      x: 120,
      y: 390,
      width: 1050,
      height: 220,
      rotation: 0,
      opacity: 1,
      zIndex: 20,
      start: 0.4,
      end: 5.6,
      animation: "rise",
      color: "#ffffff",
      fontSize: 92,
      fontWeight: 900,
    },
  ],
};

function resolveSource(source: string) {
  return source.startsWith("/") ? staticFile(source.slice(1)) : source;
}

function animationTransform(element: IntroSceneElement, progress: number) {
  const offset = (1 - progress) * 120;
  if (element.animation === "slide-left") return `translateX(${-offset}px)`;
  if (element.animation === "slide-right") return `translateX(${offset}px)`;
  if (element.animation === "rise") return `translateY(${offset}px)`;
  if (element.animation === "pop") return `scale(${0.72 + progress * 0.28})`;
  return "none";
}

function SceneElement({ element }: { element: IntroSceneElement }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = element.start * fps;
  const endFrame = element.end * fps;
  const enter = element.animation === "none" ? 1 : spring({ frame: frame - startFrame, fps, config: { damping: 16, stiffness: 110 } });
  const exit = interpolate(frame, [endFrame - fps * 0.25, endFrame], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const visible = frame >= startFrame && frame <= endFrame;
  const style: CSSProperties = {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    opacity: visible ? element.opacity * enter * exit : 0,
    transform: `${animationTransform(element, enter)} rotate(${element.rotation}deg)`,
    transformOrigin: "center",
    overflow: "hidden",
  };

  if (element.type === "text") {
    return (
      <div style={{ ...style, display: "flex", alignItems: "center", color: element.color, fontSize: element.fontSize, fontWeight: element.fontWeight, lineHeight: 1.05, wordBreak: "keep-all", whiteSpace: "pre-wrap", textShadow: "0 4px 18px rgba(0,0,0,.28)" }}>
        {element.text}
      </div>
    );
  }

  if (!element.src) return null;
  return <Img src={resolveSource(element.src)} style={{ ...style, objectFit: element.type === "background" ? "cover" : "contain" }} />;
}

export function SceneComposition({ scene }: { scene: IntroScene }) {
  return (
    <AbsoluteFill style={{ backgroundColor: scene.backgroundColor, fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      {[...scene.elements].sort((a, b) => a.zIndex - b.zIndex).map((element) => <SceneElement key={element.id} element={element} />)}
    </AbsoluteFill>
  );
}
