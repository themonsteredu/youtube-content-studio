import { randomUUID } from "node:crypto";
import { assertAdminApi, authErrorResponse } from "@/lib/auth-api";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const admin = await assertAdminApi();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "이미지 파일이 필요합니다." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: "파일은 10MB 이하여야 합니다." }, { status: 400 });
    if (!file.type.startsWith("image/")) return Response.json({ error: "이미지 형식만 업로드할 수 있습니다." }, { status: 400 });

    const id = randomUUID();
    const title = String(form.get("title") || file.name);
    const category = String(form.get("category") || "activity");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${admin.id}/${id}.${extension}`;
    const supabase = await getSupabaseServer();

    if (!supabase) {
      const bytes = Buffer.from(await file.arrayBuffer());
      return Response.json({ asset: { id, title, url: `data:${file.type};base64,${bytes.toString("base64")}`, storagePath, category, tags: [], focalX: 50, focalY: 50, recommended: false, createdAt: new Date().toISOString() } });
    }

    const { error: uploadError } = await supabase.storage.from("youtube-assets").upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from("youtube-assets").getPublicUrl(storagePath);
    const { data, error } = await supabase.from("media_assets").insert({ id, title, storage_path: storagePath, public_url: publicUrl.publicUrl, category, owner_id: admin.id }).select("*").single();
    if (error) throw error;
    return Response.json({ asset: { id: data.id, title: data.title, url: data.public_url, storagePath: data.storage_path, category: data.category, tags: data.tags ?? [], focalX: data.focal_x, focalY: data.focal_y, recommended: data.recommended, createdAt: data.created_at } });
  } catch (error) { return authErrorResponse(error); }
}
