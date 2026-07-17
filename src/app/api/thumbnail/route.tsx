import { ImageResponse } from "next/og";
import { z } from "zod";
import { assertAdminApi, authErrorResponse } from "@/lib/auth-api";

export const runtime = "nodejs";

const input = z.object({ title: z.string().min(2).max(60), subtitle: z.string().max(80), episode: z.string().max(20), imageUrl: z.string(), accent: z.string() });

export async function POST(request: Request) {
  let draft: z.infer<typeof input>;
  try {
    await assertAdminApi();
    draft = input.parse(await request.json());
  } catch (error) { return authErrorResponse(error); }

  const imageUrl = draft.imageUrl.startsWith("/") ? new URL(draft.imageUrl, request.url).toString() : draft.imageUrl;
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", backgroundColor: "#111", color: "white", fontFamily: "sans-serif" }}>
      {/* ImageResponse renders HTML-compatible elements rather than next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" width="1920" height="1080" style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,.88), rgba(0,0,0,.08) 72%)" }} />
      <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 110, right: 110, bottom: 100 }}>
        <div style={{ display: "flex", alignSelf: "flex-start", background: draft.accent, color: "#151515", padding: "10px 20px", fontSize: 30, fontWeight: 800 }}>{draft.episode || "NEW"}</div>
        <div style={{ display: "flex", maxWidth: 1500, marginTop: 22, fontSize: 96, lineHeight: 1.05, fontWeight: 900 }}>{draft.title}</div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 34, color: "rgba(255,255,255,.82)" }}>{draft.subtitle}</div>
      </div>
    </div>,
    { width: 1920, height: 1080 },
  );
}
