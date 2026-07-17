import Link from "next/link";

export default function ForbiddenPage() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}><section className="panel" style={{ padding: 30, textAlign: "center" }}><h1>접근 권한이 없습니다</h1><p style={{ color: "#69707d" }}>관리자 계정으로 로그인해 주세요.</p><Link className="button" href="/login">로그인으로 이동</Link></section></main>;
}
