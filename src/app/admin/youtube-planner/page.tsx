import { PlannerClient } from "@/components/planner-client";

export default function YoutubePlannerPage() {
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h2>AI 기획 보드</h2>
          <p>여러 AI의 답변을 모으고, 필요한 내용만 골라 최종 기획서로 정리합니다.</p>
        </div>
      </div>
      <PlannerClient />
    </div>
  );
}
