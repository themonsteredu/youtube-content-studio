import type { MediaAsset, RenderJob } from "@/types/studio";

export const demoAssets: MediaAsset[] = [
  { id: "demo-1", title: "아이들과 데이터 수업", url: "/demo/classroom.png", storagePath: "demo/classroom.png", category: "class", tags: ["수업", "데이터", "교실"], focalX: 48, focalY: 42, recommended: true, createdAt: "2026-07-15T09:00:00+09:00" },
  { id: "demo-2", title: "원장님 현장 인터뷰", url: "/demo/director.png", storagePath: "demo/director.png", category: "portrait", tags: ["원장님", "인터뷰"], focalX: 54, focalY: 36, recommended: true, createdAt: "2026-07-14T14:20:00+09:00" },
  { id: "demo-3", title: "창의 활동 시간", url: "/demo/activity.png", storagePath: "demo/activity.png", category: "activity", tags: ["활동", "만들기"], focalX: 50, focalY: 50, recommended: false, createdAt: "2026-07-12T11:10:00+09:00" },
  { id: "demo-4", title: "학원 전경", url: "/demo/space.png", storagePath: "demo/space.png", category: "space", tags: ["공간", "브랜딩"], focalX: 50, focalY: 55, recommended: false, createdAt: "2026-07-10T16:40:00+09:00" },
];

export const demoJobs: RenderJob[] = [
  { id: "job-1024", title: "AI 시대, 아이에게 정말 필요한 공부", kind: "thumbnail", status: "ready", outputUrl: "/demo/classroom.png", createdAt: "2026-07-16T18:22:00+09:00" },
  { id: "job-1023", title: "원장님이 직접 해봤습니다", kind: "intro", status: "processing", createdAt: "2026-07-16T17:48:00+09:00" },
  { id: "job-1022", title: "데이터로 읽는 우리 반 이야기", kind: "intro", status: "ready", createdAt: "2026-07-15T13:05:00+09:00" },
];
