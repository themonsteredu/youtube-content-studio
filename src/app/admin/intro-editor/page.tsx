import { redirect } from "next/navigation";

export default async function IntroEditorPage() {
  redirect("/admin/youtube-generator?mode=intro");
}
