export type MediaAsset = {
  id: string;
  title: string;
  url: string;
  storagePath: string;
  category: "class" | "activity" | "portrait" | "space";
  tags: string[];
  focalX: number;
  focalY: number;
  recommended: boolean;
  createdAt: string;
};

export type ContentDraft = {
  title: string;
  subtitle: string;
  episode: string;
  imageUrl: string;
  imageId?: string;
  template: "bold" | "documentary" | "clean";
  accent: string;
  duration: number;
};

export type RenderJob = {
  id: string;
  title: string;
  kind: "thumbnail" | "intro";
  status: "ready" | "processing" | "failed";
  outputUrl?: string;
  createdAt: string;
};

export type SceneElementType = "background" | "image" | "text" | "logo";
export type SceneAnimation = "none" | "fade" | "slide-left" | "slide-right" | "rise" | "pop";

export type IntroSceneElement = {
  id: string;
  type: SceneElementType;
  name: string;
  src?: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  start: number;
  end: number;
  animation: SceneAnimation;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
};

export type IntroScene = {
  title: string;
  duration: number;
  backgroundColor: string;
  elements: IntroSceneElement[];
};
