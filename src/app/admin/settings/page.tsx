import { ApiSettingsClient } from "@/components/api-settings-client";

export default function SettingsPage() {
  return (
    <div className="content settings-content">
      <div className="page-head">
        <div>
          <h2>설정</h2>
          <p>필요할 때만 AI API를 켜고, 사용할 공급자와 모델을 선택합니다.</p>
        </div>
      </div>
      <ApiSettingsClient />
    </div>
  );
}
