export const API_SETTINGS_KEY = "youtube-studio:api-settings";
export const API_SECRET_KEY = "youtube-studio:api-secret";
export const PLANNER_KEY = "youtube-studio:planner";

export type ApiProvider = "openai" | "anthropic" | "google";

export type ApiSettings = {
  enabled: boolean;
  provider: ApiProvider;
  model: string;
  rememberKey: boolean;
};

export const defaultApiSettings: ApiSettings = {
  enabled: false,
  provider: "openai",
  model: "gpt-5-mini",
  rememberKey: false,
};

export function readApiSettings(): ApiSettings {
  if (typeof window === "undefined") return defaultApiSettings;

  try {
    const stored = window.localStorage.getItem(API_SETTINGS_KEY);
    return stored ? { ...defaultApiSettings, ...JSON.parse(stored) } : defaultApiSettings;
  } catch {
    return defaultApiSettings;
  }
}

export function readApiSecret(rememberKey: boolean) {
  if (typeof window === "undefined") return "";
  return (rememberKey ? window.localStorage : window.sessionStorage).getItem(API_SECRET_KEY) ?? "";
}
