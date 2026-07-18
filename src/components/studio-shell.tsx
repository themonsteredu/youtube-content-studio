"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, History, Images, NotebookPen, Settings, Sparkles } from "lucide-react";

const items = [
  { href: "/admin/youtube-planner", label: "AI 기획 보드", icon: NotebookPen },
  { href: "/admin/youtube-gallery", label: "이미지 갤러리", icon: Images },
  { href: "/admin/youtube-generator", label: "콘텐츠 스튜디오", icon: Sparkles },
  { href: "/admin/youtube-history", label: "생성 이력", icon: History },
];

const settingsItem = { href: "/admin/settings", label: "설정", icon: Settings };
const allItems = [...items, settingsItem];

export function StudioShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const current = allItems.find((item) => pathname.startsWith(item.href));

  return (
    <div className="studio-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Clapperboard size={19} /></div>
          <div><strong>별거 다하는 원장님</strong><span>CONTENT STUDIO</span></div>
        </div>
        <nav className="nav" aria-label="관리자 메뉴">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link ${pathname.startsWith(href) ? "active" : ""}`}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
        <div className="nav-bottom">
          <Link href={settingsItem.href} className={`nav-link ${pathname.startsWith(settingsItem.href) ? "active" : ""}`}>
            <Settings size={17} /> 설정
          </Link>
          <div className="sidebar-foot">YouTube 운영 도구<br />v0.2 studio</div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <h1>{current?.label ?? "콘텐츠 스튜디오"}</h1>
          <div className="admin-id"><span className="admin-dot" />{email}</div>
        </header>
        {children}
      </main>
      <nav className="mobile-nav" aria-label="모바일 관리자 메뉴">
        {allItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={pathname.startsWith(href) ? "active" : ""}><Icon size={18} />{label}</Link>)}
      </nav>
    </div>
  );
}
