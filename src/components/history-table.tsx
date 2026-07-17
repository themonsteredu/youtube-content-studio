"use client";

import { Download, RefreshCw } from "lucide-react";
import type { RenderJob } from "@/types/studio";

const statusText = { ready: "완료", processing: "렌더링 중", failed: "실패" };

export function HistoryTable({ jobs }: { jobs: RenderJob[] }) {
  return (
    <section className="panel">
      <div className="panel-head"><h3>최근 생성 결과</h3><button className="button secondary icon" title="새로고침" onClick={() => location.reload()}><RefreshCw size={15} /></button></div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>콘텐츠</th><th>형식</th><th>상태</th><th>생성 시각</th><th>파일</th></tr></thead>
          <tbody>
            {jobs.map((job) => <tr key={job.id}>
              <td className="history-title">{job.title}</td>
              <td>{job.kind === "thumbnail" ? "PNG 썸네일" : "MP4 인트로"}</td>
              <td><span className={`status ${job.status}`}>{statusText[job.status]}</span></td>
              <td>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(job.createdAt))}</td>
              <td>{job.outputUrl ? <a className="button secondary icon" title="다운로드" href={job.outputUrl} download><Download size={15} /></a> : "-"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}
