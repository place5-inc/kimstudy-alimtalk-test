import { useState } from "react";
import { callProxy } from "../../shared/api/client";

interface FunnelLog {
  id: number;
  device_id: string | null;
  phone_number: string | null;
  os: string | null;
  user_role: string | null;
  step: string | null;
  log_at: string | null;
  completed_at: string | null;
}

function fmtDt(dt: string | null) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString("ko-KR", {
      year: "2-digit", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return dt; }
}

export function SignupFunnelLogTab() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<FunnelLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    setLoading(true);
    setLogs(null);
    setError(null);
    try {
      const r = await callProxy("/admin/test/get/signup/funnel/log", {});
      if (!r.ok) { setError(`HTTP ${r.status}: ${r.body}`); return; }
      const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; data?: FunnelLog[] };
      if (!json.isSuccess) { setError(json.systemMessage ?? "조회 실패"); return; }
      setLogs(json.data ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="page-title">가입이탈기록로그</p>
      <p className="page-subtitle">최근 20건의 회원가입 funnel 로그입니다. completed_at이 있으면 가입 완료, 없으면 이탈입니다.</p>

      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-send"
          disabled={loading}
          onClick={() => void handleLoad()}
          style={{ padding: "8px 24px" }}
        >
          {loading ? "조회 중…" : "🔍 로그 조회"}
        </button>
      </div>

      {error && <p style={{ color: "#c53030", fontSize: 13 }}>{error}</p>}

      {logs && (
        <div style={{ overflowX: "auto" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#718096" }}>총 {logs.length}건</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ background: "#f7fafc" }}>
                {["ID", "디바이스 ID", "전화번호", "OS", "역할", "단계(step)", "로그시각", "완료시각"].map((h) => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #f0f0f0" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const done = !!log.completed_at;
                return (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid #f0f0f0", background: done ? "rgba(39,103,73,0.05)" : "rgba(197,48,48,0.03)" }}
                  >
                    <td style={{ padding: "6px 10px", color: "#4a5568", fontFamily: "monospace" }}>{log.id}</td>
                    <td style={{ padding: "6px 10px", color: "#4a5568", fontFamily: "monospace", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{log.device_id ?? "-"}</td>
                    <td style={{ padding: "6px 10px", color: "#1a202c", fontWeight: 600 }}>{log.phone_number ?? "-"}</td>
                    <td style={{ padding: "6px 10px", color: "#4a5568" }}>{log.os ?? "-"}</td>
                    <td style={{ padding: "6px 10px", color: "#4a5568" }}>{log.user_role ?? "-"}</td>
                    <td style={{ padding: "6px 10px" }}>
                      <span style={{ fontWeight: 600, color: "#2d3748", background: "#edf2f7", borderRadius: 4, padding: "2px 7px" }}>
                        {log.step ?? "-"}
                      </span>
                    </td>
                    <td style={{ padding: "6px 10px", color: "#718096", fontFamily: "monospace" }}>{fmtDt(log.log_at)}</td>
                    <td style={{ padding: "6px 10px" }}>
                      {done
                        ? <span style={{ color: "#276749", fontWeight: 700 }}>✅ {fmtDt(log.completed_at)}</span>
                        : <span style={{ color: "#c53030", fontWeight: 600 }}>— 이탈</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
