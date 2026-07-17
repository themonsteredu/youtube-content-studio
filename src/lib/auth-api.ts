import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

export async function assertAdminApi() {
  if (!isSupabaseConfigured()) return { id: "demo-admin" };
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const { data: profile } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("FORBIDDEN");
  return { id: user.id };
}

export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "UNAUTHORIZED") return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  return Response.json({ error: "요청을 처리하지 못했습니다." }, { status: 500 });
}
