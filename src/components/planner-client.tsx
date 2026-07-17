"use client";

import { Check, ClipboardPaste, Plus, Send, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { PLANNER_KEY, readApiSettings } from "@/lib/client-settings";

type SourceKind = "아이디어" | "조사" | "제목" | "구성안" | "대본";
type PlanField = "titleIdeas" | "hook" | "outline" | "script" | "assets" | "notes";

type AiSource = {
  id: string;
  provider: string;
  kind: SourceKind;
  title: string;
  content: string;
  createdAt: string;
};

type PlannerState = {
  projectTitle: string;
  status: "초안" | "검토 중" | "확정";
  purpose: string;
  audience: string;
  keyMessage: string;
  titleIdeas: string;
  hook: string;
  outline: string;
  script: string;
  assets: string;
  notes: string;
  sources: AiSource[];
};

const emptyPlanner: PlannerState = {
  projectTitle: "새 유튜브 콘텐츠",
  status: "초안",
  purpose: "",
  audience: "",
  keyMessage: "",
  titleIdeas: "",
  hook: "",
  outline: "",
  script: "",
  assets: "",
  notes: "",
  sources: [],
};

const fieldLabels: Record<PlanField, string> = {
  titleIdeas: "제목 후보",
  hook: "오프닝 훅",
  outline: "전체 구성",
  script: "최종 대본",
  assets: "필요한 사진·영상",
  notes: "내 메모",
};

export function PlannerClient() {
  const [planner, setPlanner] = useState<PlannerState>(emptyPlanner);
  const [ready, setReady] = useState(false);
  const [provider, setProvider] = useState("ChatGPT");
  const [kind, setKind] = useState<SourceKind>("아이디어");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceContent, setSourceContent] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selection, setSelection] = useState("");
  const [target, setTarget] = useState<PlanField>("outline");
  const [apiEnabled, setApiEnabled] = useState(false);

  useEffect(() => {
    const syncApi = () => setApiEnabled(readApiSettings().enabled);
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(PLANNER_KEY);
        if (stored) setPlanner({ ...emptyPlanner, ...JSON.parse(stored) });
      } catch {
        // A damaged local draft should not block a new plan.
      }
      syncApi();
      setReady(true);
    });
    window.addEventListener("youtube-studio:api-settings-changed", syncApi);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("youtube-studio:api-settings-changed", syncApi);
    };
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(PLANNER_KEY, JSON.stringify(planner));
  }, [planner, ready]);

  const activeSource = useMemo(() => planner.sources.find((source) => source.id === activeId) ?? planner.sources[0], [activeId, planner.sources]);

  function update<K extends keyof PlannerState>(key: K, value: PlannerState[K]) {
    setPlanner((current) => ({ ...current, [key]: value }));
  }

  function addSource() {
    if (!sourceContent.trim()) return;
    const source: AiSource = {
      id: crypto.randomUUID(),
      provider,
      kind,
      title: sourceTitle.trim() || `${provider} ${kind}`,
      content: sourceContent.trim(),
      createdAt: new Date().toISOString(),
    };
    setPlanner((current) => ({ ...current, sources: [source, ...current.sources] }));
    setActiveId(source.id);
    setSourceTitle("");
    setSourceContent("");
    setSelection("");
  }

  function sendToPlan() {
    const text = selection.trim() || activeSource?.content.trim();
    if (!text) return;
    setPlanner((current) => ({ ...current, [target]: [current[target], text].filter(Boolean).join("\n\n") }));
    setSelection("");
  }

  function removeSource(id: string) {
    setPlanner((current) => ({ ...current, sources: current.sources.filter((source) => source.id !== id) }));
    setActiveId(null);
    setSelection("");
  }

  if (!ready) return <div className="panel empty">기획서를 불러오는 중입니다.</div>;

  return (
    <div className="planner-stack">
      <section className="panel project-strip">
        <div className="project-name">
          <label className="label" htmlFor="project-title">프로젝트</label>
          <input id="project-title" className="input" value={planner.projectTitle} onChange={(event) => update("projectTitle", event.target.value)} />
        </div>
        <div className="project-status">
          <label className="label" htmlFor="project-status">상태</label>
          <select id="project-status" className="select" value={planner.status} onChange={(event) => update("status", event.target.value as PlannerState["status"])}>
            <option>초안</option><option>검토 중</option><option>확정</option>
          </select>
        </div>
        <div className="autosave"><Check size={14} /> 이 브라우저에 자동 저장</div>
        <div className={`api-state ${apiEnabled ? "on" : ""}`}>{apiEnabled ? "AI API 켜짐" : "AI API 꺼짐"}</div>
      </section>

      <div className="planner-grid">
        <section className="panel source-panel">
          <div className="panel-head"><h3>AI 자료 수집함</h3><span className="chip">{planner.sources.length}개</span></div>
          <div className="panel-body source-form">
            <div className="field-row">
              <div className="field"><label className="label">출처</label><select className="select" value={provider} onChange={(event) => setProvider(event.target.value)}><option>ChatGPT</option><option>Claude</option><option>Gemini</option><option>Perplexity</option><option>기타</option></select></div>
              <div className="field"><label className="label">자료 유형</label><select className="select" value={kind} onChange={(event) => setKind(event.target.value as SourceKind)}><option>아이디어</option><option>조사</option><option>제목</option><option>구성안</option><option>대본</option></select></div>
            </div>
            <div className="field"><label className="label">자료 이름</label><input className="input" value={sourceTitle} placeholder="예: 학부모 공감형 구성안" onChange={(event) => setSourceTitle(event.target.value)} /></div>
            <div className="field"><label className="label">AI 답변 붙여넣기</label><textarea className="textarea source-paste" value={sourceContent} placeholder="ChatGPT나 Claude에서 만든 내용을 여기에 붙여넣으세요." onChange={(event) => setSourceContent(event.target.value)} /></div>
            <button className="button" type="button" disabled={!sourceContent.trim()} onClick={addSource}><Plus size={15} /> 자료 추가</button>
          </div>
          <div className="source-list">
            {planner.sources.length === 0 && <div className="source-empty"><ClipboardPaste size={22} /><span>붙여넣은 자료가 아직 없습니다.</span></div>}
            {planner.sources.map((source) => (
              <button key={source.id} type="button" className={`source-item ${activeSource?.id === source.id ? "active" : ""}`} onClick={() => { setActiveId(source.id); setSelection(""); }}>
                <span><strong>{source.title}</strong><small>{source.provider} · {source.kind}</small></span>
                <span className="source-date">{new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(new Date(source.createdAt))}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel source-reader">
          <div className="panel-head"><h3>원본 확인</h3>{activeSource && <button className="button icon secondary" title="자료 삭제" type="button" onClick={() => removeSource(activeSource.id)}><Trash2 size={15} /></button>}</div>
          <div className="panel-body">
            {activeSource ? (
              <>
                <div className="reader-meta"><span className="status ready">{activeSource.provider}</span><strong>{activeSource.title}</strong></div>
                <textarea
                  className="textarea source-reader-text"
                  value={activeSource.content}
                  readOnly
                  onSelect={(event) => {
                    const field = event.currentTarget;
                    setSelection(field.value.slice(field.selectionStart, field.selectionEnd));
                  }}
                />
                <div className="send-bar">
                  <select className="select" aria-label="보낼 기획서 항목" value={target} onChange={(event) => setTarget(event.target.value as PlanField)}>{Object.entries(fieldLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  <button className="button" type="button" onClick={sendToPlan}><Send size={14} /> {selection ? "선택 문장 보내기" : "전체 보내기"}</button>
                </div>
                <p className="selection-help">필요한 문장을 드래그해서 선택하면 그 부분만 기획서로 보낼 수 있습니다.</p>
              </>
            ) : <div className="source-empty reader-empty"><ClipboardPaste size={25} /><span>왼쪽에서 AI 답변을 추가하세요.</span></div>}
          </div>
        </section>

        <section className="panel final-plan">
          <div className="panel-head"><h3>최종 기획서</h3><span className={`status ${planner.status === "확정" ? "ready" : "processing"}`}>{planner.status}</span></div>
          <div className="panel-body">
            <div className="plan-summary">
              <PlanField label="영상 목적" value={planner.purpose} onChange={(value) => update("purpose", value)} />
              <PlanField label="시청 대상" value={planner.audience} onChange={(value) => update("audience", value)} />
              <PlanField label="핵심 메시지" value={planner.keyMessage} onChange={(value) => update("keyMessage", value)} wide />
            </div>
            <PlanField label="제목 후보" value={planner.titleIdeas} onChange={(value) => update("titleIdeas", value)} />
            <PlanField label="오프닝 훅" value={planner.hook} onChange={(value) => update("hook", value)} />
            <PlanField label="전체 구성" value={planner.outline} onChange={(value) => update("outline", value)} tall />
            <PlanField label="최종 대본" value={planner.script} onChange={(value) => update("script", value)} tall />
            <div className="field-row">
              <PlanField label="필요한 사진·영상" value={planner.assets} onChange={(value) => update("assets", value)} />
              <PlanField label="내 메모" value={planner.notes} onChange={(value) => update("notes", value)} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PlanField({ label, value, onChange, tall = false, wide = false }: { label: string; value: string; onChange: (value: string) => void; tall?: boolean; wide?: boolean }) {
  const id = useId();
  return <div className={`field ${wide ? "wide" : ""}`}><label className="label" htmlFor={id}>{label}</label><textarea id={id} className={`textarea ${tall ? "plan-tall" : ""}`} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}
