import { z } from "zod";
import { assertAdminApi } from "@/lib/auth-api";

export const runtime = "nodejs";
export const maxDuration = 180;

const inputSchema = z.object({
  kind: z.enum(["background", "portrait"]),
  preset: z.string().min(1).max(80),
  prompt: z.string().max(600).default(""),
  referenceImage: z.string().max(12_000_000).optional(),
});

type OpenAiImageResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string; code?: string };
};

function apiError(status: number, payload: OpenAiImageResponse) {
  if (status === 401) return "API 키가 올바르지 않습니다.";
  if (status === 429) return "API 사용 한도 또는 결제 상태를 확인하세요.";
  if (payload.error?.code === "moderation_blocked") return "이미지 안전 기준에 맞게 요청 내용을 바꿔주세요.";
  return payload.error?.message || "AI 이미지를 생성하지 못했습니다.";
}

function parseDataImage(source: string) {
  const match = source.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("REFERENCE_IMAGE_INVALID");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error("REFERENCE_IMAGE_INVALID");
  return { bytes, mimeType: match[1] };
}

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const apiKey = request.headers.get("x-openai-api-key")?.trim() ?? "";
    if (apiKey.length < 20) return Response.json({ error: "설정 메뉴에 OpenAI API 키를 저장하세요." }, { status: 400 });

    const input = inputSchema.parse(await request.json());
    let openAiResponse: Response;
    let mimeType = "image/jpeg";

    if (input.kind === "background") {
      const prompt = [
        "Create a polished photorealistic 16:9 YouTube background for a Korean education channel.",
        `Theme: ${input.preset}.`,
        "No people, no text, no letters, no logos. Keep one side visually quiet for a presenter and the other side quiet for a large title.",
        "Bright, clean, professional lighting, realistic depth, suitable for a YouTube intro.",
        input.prompt,
      ].filter(Boolean).join(" ");

      openAiResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model: "gpt-image-2", prompt, size: "1536x1024", quality: "medium", output_format: "jpeg", output_compression: 88, n: 1 }),
        signal: AbortSignal.timeout(170_000),
      });
    } else {
      if (!input.referenceImage) return Response.json({ error: "기준 인물 사진을 선택하세요." }, { status: 400 });
      const { bytes, mimeType: referenceMime } = parseDataImage(input.referenceImage);
      const extension = referenceMime === "image/png" ? "png" : referenceMime === "image/webp" ? "webp" : "jpg";
      const form = new FormData();
      form.append("model", "gpt-image-2");
      form.append("image[]", new Blob([bytes], { type: referenceMime }), `reference.${extension}`);
      form.append("prompt", [
        "Use the reference photo to preserve this adult person's identity, face shape, hairstyle, and age.",
        `Create a photorealistic upper-body presenter pose: ${input.preset}.`,
        "Natural hands and fingers, dark neutral clothing without green, centered subject, studio lighting.",
        "Use a perfectly flat pure chroma-key green background (#00FF00), with no shadows on the background, no text, and no logo.",
        input.prompt,
      ].filter(Boolean).join(" "));
      form.append("size", "1024x1536");
      form.append("quality", "medium");
      form.append("output_format", "png");
      form.append("n", "1");
      mimeType = "image/png";

      openAiResponse = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(170_000),
      });
    }

    const payload = await openAiResponse.json() as OpenAiImageResponse;
    if (!openAiResponse.ok) return Response.json({ error: apiError(openAiResponse.status, payload) }, { status: openAiResponse.status });
    const base64 = payload.data?.[0]?.b64_json;
    if (!base64) return Response.json({ error: "생성된 이미지 데이터가 없습니다." }, { status: 502 });
    return Response.json({ image: `data:${mimeType};base64,${base64}`, model: "gpt-image-2" });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "이미지 생성 요청 형식이 올바르지 않습니다." }, { status: 400 });
    if (error instanceof Error && error.message === "REFERENCE_IMAGE_INVALID") return Response.json({ error: "기준 인물 사진은 8MB 이하 PNG, JPG 또는 WebP여야 합니다." }, { status: 400 });
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    return Response.json({ error: "AI 이미지 요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
