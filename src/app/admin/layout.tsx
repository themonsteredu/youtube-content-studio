import { StudioShell } from "@/components/studio-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <StudioShell email={admin.email}>{children}</StudioShell>;
}
