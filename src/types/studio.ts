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
