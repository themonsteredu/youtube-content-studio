"use client";

import { Clapperboard, LogIn } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { error: authError } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      location.href = "/admin/youtube-generator";
    } catch (caught) { setError(caught instanceof Error ? caught.message : "로그인에 실패했습니다."); setBusy(false); }
  }

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}><form className="panel" onSubmit={login} style={{ width: "min(390px, 100%)", padding: 28 }}><div className="brand" style={{ color: "#17191d", padding: "0 0 26px" }}><div className="brand-mark" style={{ color: "white" }}><Clapperboard size={19} /></div><div><strong>별거 다하는 원장님</strong><span>관리자 로그인</span></div></div><div className="field"><label className="label">이메일</label><input className="input" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="field"><label className="label">비밀번호</label><input className="input" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>{error && <p className="form-error">{error}</p>}<button className="button" style={{ width: "100%" }} disabled={busy}><LogIn size={15} />{busy ? "확인 중" : "로그인"}</button></form></main>;
}
