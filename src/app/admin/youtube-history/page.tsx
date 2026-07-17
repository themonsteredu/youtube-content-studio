import { HistoryTable } from "@/components/history-table";
import { listJobs } from "@/lib/studio-data";

export default async function HistoryPage() {
  const jobs = await listJobs();
  return <div className="content"><div className="page-head"><div><h2>생성 이력</h2><p>썸네일과 인트로 렌더링 결과를 확인합니다.</p></div></div><HistoryTable jobs={jobs} /></div>;
}
