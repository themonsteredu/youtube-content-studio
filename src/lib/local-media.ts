import type { IntroScene, MediaAsset } from "@/types/studio";

const DATABASE_NAME = "youtube-content-studio";
const DATABASE_VERSION = 2;
const ASSET_STORE = "media-assets";
const SCENE_STORE = "intro-scenes";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ASSET_STORE)) {
        database.createObjectStore(ASSET_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(SCENE_STORE)) {
        database.createObjectStore(SCENE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listLocalAssets(): Promise<MediaAsset[]> {
  if (typeof window === "undefined" || !window.indexedDB) return [];

  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(ASSET_STORE, "readonly").objectStore(ASSET_STORE).getAll();
    request.onsuccess = () => {
      database.close();
      resolve((request.result as MediaAsset[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export async function saveLocalAsset(asset: MediaAsset) {
  if (typeof window === "undefined" || !window.indexedDB) return;

  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const request = database.transaction(ASSET_STORE, "readwrite").objectStore(ASSET_STORE).put(asset);
    request.onsuccess = () => {
      database.close();
      resolve();
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export function mergeAssets(localAssets: MediaAsset[], initialAssets: MediaAsset[]) {
  const merged = new Map<string, MediaAsset>();
  for (const asset of [...localAssets, ...initialAssets]) {
    if (!merged.has(asset.id)) merged.set(asset.id, asset);
  }
  return [...merged.values()];
}

export async function loadLocalScene(): Promise<IntroScene | null> {
  if (typeof window === "undefined" || !window.indexedDB) return null;
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(SCENE_STORE, "readonly").objectStore(SCENE_STORE).get("main");
    request.onsuccess = () => {
      database.close();
      resolve((request.result as { id: string; scene: IntroScene } | undefined)?.scene ?? null);
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export async function saveLocalScene(scene: IntroScene) {
  if (typeof window === "undefined" || !window.indexedDB) return;
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const request = database.transaction(SCENE_STORE, "readwrite").objectStore(SCENE_STORE).put({ id: "main", scene });
    request.onsuccess = () => {
      database.close();
      resolve();
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}
