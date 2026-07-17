"use client";

import { Check, Eye, EyeOff, KeyRound, Power } from "lucide-react";
import { useEffect, useState } from "react";
import {
  API_SECRET_KEY,
  API_SETTINGS_KEY,
  defaultApiSettings,
  readApiSecret,
  readApiSettings,
  type ApiProvider,
  type ApiSettings,
} from "@/lib/client-settings";

const providerModels: Record<ApiProvider, string> = {
  openai: "gpt-5-mini",
  anthropic: "claude-sonnet-4-5",
  google: "gemini-2.5-flash",
};

export function ApiSettingsClient() {
  const [settings, setSettings] = useState<ApiSettings>(defaultApiSettings);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readApiSettings();
      setSettings(stored);
      setApiKey(readApiSecret(stored.rememberKey));
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function updateProvider(provider: ApiProvider) {
    setSettings((current) => ({ ...current, provider, model: providerModels[provider] }));
    setSaved(false);
  }

  function save() {
    window.localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settings));
    window.localStorage.removeItem(API_SECRET_KEY);
    window.sessionStorage.removeItem(API_SECRET_KEY);
    const target = settings.rememberKey ? window.localStorage : window.sessionStorage;
    if (apiKey.trim()) target.setItem(API_SECRET_KEY, apiKey.trim());
    window.dispatchEvent(new Event("youtube-studio:api-settings-changed"));
    setSaved(true);
  }

  if (!ready) return <div className="panel empty">설정을 불러오는 중입니다.</div>;

  return (
    <div className="settings-stack">
      <section className="panel">
        <div className="settings-master">
          <div className={`settings-icon ${settings.enabled ? "on" : ""}`}><Power size={20} /></div>
          <div className="settings-copy">
            <strong>AI API 사용</strong>
            <p>꺼져 있으면 외부 AI로 요청을 보내지 않고, 붙여넣기와 수동 정리만 사용합니다.</p>
          </div>
          <label className="switch" aria-label="AI API 사용 여부">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => {
                setSettings((current) => ({ ...current, enabled: event.target.checked }));
                setSaved(false);
              }}
            />
            <span />
          </label>
        </div>
      </section>

      <section className={`panel ${settings.enabled ? "" : "settings-disabled"}`}>
        <div className="panel-head"><h3>API 연결 정보</h3><span className={`status ${settings.enabled ? "ready" : "failed"}`}>{settings.enabled ? "사용 중" : "꺼짐"}</span></div>
        <div className="panel-body settings-form">
          <div className="field-row">
            <div className="field">
              <label className="label" htmlFor="api-provider">공급자</label>
              <select id="api-provider" className="select" value={settings.provider} onChange={(event) => updateProvider(event.target.value as ApiProvider)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="google">Google Gemini</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="api-model">모델</label>
              <input id="api-model" className="input" value={settings.model} onChange={(event) => { setSettings((current) => ({ ...current, model: event.target.value })); setSaved(false); }} />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="api-key">API 키</label>
            <div className="secret-input">
              <KeyRound size={16} />
              <input id="api-key" type={showKey ? "text" : "password"} value={apiKey} placeholder="사용할 때 키를 입력하세요" autoComplete="off" onChange={(event) => { setApiKey(event.target.value); setSaved(false); }} />
              <button type="button" title={showKey ? "키 숨기기" : "키 보기"} onClick={() => setShowKey((current) => !current)}>{showKey ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>

          <label className="check-row">
            <input type="checkbox" checked={settings.rememberKey} onChange={(event) => { setSettings((current) => ({ ...current, rememberKey: event.target.checked })); setSaved(false); }} />
            <span><strong>이 브라우저에 API 키 저장</strong><small>개인 PC에서만 사용하세요. 끄면 브라우저를 닫을 때 키가 삭제됩니다.</small></span>
          </label>

          <div className="settings-actions">
            <button className="button" type="button" onClick={save}><Check size={15} /> 설정 저장</button>
            {saved && <span className="save-confirm">저장되었습니다.</span>}
          </div>
        </div>
      </section>

      <div className="notice">현재 자동 정리 API 호출은 연결하지 않았습니다. 설정을 켜도 사용자가 자동 정리 명령을 실행하기 전에는 외부 요청이 발생하지 않습니다.</div>
    </div>
  );
}
