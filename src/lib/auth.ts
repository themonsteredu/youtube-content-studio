import { redirect } from "next/navigation";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

export async function requireAdmin() {
  if (!isSupabaseConfigured()) return { id: "demo-admin", email: "demo@local", role: "admin" as const };

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/forbidden");
  return { id: user.id, email: user.email ?? "admin", role: "admin" as const };
}
