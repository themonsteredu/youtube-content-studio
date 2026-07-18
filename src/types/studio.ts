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

export type ThumbnailElementType = "text" | "rectangle" | "circle" | "line" | "image";
export type ThumbnailElementRole = "title" | "subtitle" | "episode" | "custom";

export type ThumbnailElement = {
  id: string;
  name: string;
  type: ThumbnailElementType;
  role?: ThumbnailElementRole;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  text?: string;
  src?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontStyle?: "strong" | "rounded" | "serif" | "modern";
  fontSize?: number;
  fontWeight?: number;
};

export type ContentDraft = {
  title: string;
  subtitle: string;
  episode: string;
  imageUrl: string;
  imageId?: string;
  template: "bold" | "documentary" | "clean";
  accent: string;
  textColor: string;
  fontStyle: "strong" | "rounded" | "serif" | "modern";
  titleSize: number;
  subtitleSize: number;
  frameStyle: "none" | "solid" | "double" | "corners";
  frameColor: string;
  frameWidth: number;
  frameInset: number;
  decoration: "none" | "underline" | "side" | "dots" | "circle";
  overlayOpacity: number;
  imageZoom: number;
  thumbnailElements?: ThumbnailElement[];
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
  brightness?: number;
  blur?: number;
  flipX?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  shadow?: number;
};

export type IntroScene = {
  title: string;
  duration: number;
  backgroundColor: string;
  elements: IntroSceneElement[];
};
