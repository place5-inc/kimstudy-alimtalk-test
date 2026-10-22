import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

interface OsCount {
  web?: number;
  android?: number;
  ios?: number;
  etc?: number;
}

interface BannerSource {
  source: string;
  sourceLabel: string;
  count: number;
  osCount: OsCount;
}

interface BannerItem {
  name: string;
  nameLabel: string;
  totalCount: number;
  osCount: OsCount;
  sources: BannerSource[];
}

interface BannerLogResponse {
  isSuccess: boolean;
  systemMessage: string | null;
  totalCount?: number;
  osCount?: OsCount;
  list?: BannerItem[];
}

function OsBar({ osCount }: { osCount: OsCount }) {
  const items = [
    { key: "web",     label: "웹",     color: "#3182ce" },
    { key: "android", label: "AOS",    color: "#38a169" },
    { key: "ios",     label: "iOS",    color: "#805ad5" },
    { key: "etc",     label: "기타",   color: "#a0aec0" },
  ] as const;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {items.map(({ key, label, color }) => {
        const val = osCount[key] ?? 0;
        if (val === 0) return null;
        return (
          <span key={key} style={{
            fontSize: 11, padding: "2px 7px", borderRadius: 10,
            background: color + "20", color, fontWeight: 600, border: `1px solid ${color}40`,
          }}>
            {label} {val.toLocaleString()}
          </span>
        );
      })}
    </div>
  );
}

export function BannerClickLogTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [busy, setBusy]           = useState(false);
  const [result, setResult]       = useState<ResultState | null>(null);
  const [data, setData]           = useState<BannerLogResponse | null>(null);
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());

  const { logout } = useAuth();
  const { env }    = useEnv();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setResult(null);
      setData(null);
      try {
        const params: Record<string, string> = { loginId: "poiu1234" };
        if (startDate) params.startDate = startDate;
        if (endDate)   params.endDate   = endDate;

        const r = await callProxy("/admin/test/banner/log", params, { env });
        if (!r.body.trim()) { setResult({ ok: false, message: `빈 응답 (${r.status})` }); return; }
        const json = JSON.parse(r.body) as BannerLogResponse;
        if (json.isSuccess) {
          setData(json);
          setResult({ ok: true, message: `총 ${(json.totalCount ?? 0).toLocaleString()}건 조회됨` });
        } else {
          setResult({ ok: false, message: json.systemMessage ?? `실패 (${r.status})` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setBusy(false);
      }
    },
    [startDate, endDate, env, logout],
  );

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div>
      <p className="page-title">배너 클릭 로그</p>
      <p className="page-subtitle">배너별 클릭 수를 날짜 범위로 조회합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">조회 조건</p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div className="field" style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="bl_start">시작일</label>
            <input
              id="bl_start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="bl_end">종료일</label>
            <input
              id="bl_end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 11, color: "#a0aec0" }}>
          날짜 미입력 시 전체 기간 조회
        </p>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "조회 중..." : "조회"}
        </button>

        <ResultBox result={result} />
      </form>

      {data?.list && data.list.length > 0 && (
        <div className="section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p className="section-title" style={{ margin: 0 }}>조회 결과</p>
            {data.osCount && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#718096" }}>전체</span>
                <OsBar osCount={data.osCount} />
              </div>
            )}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f7fafc" }}>
                <th style={thStyle}>배너</th>
                <th style={{ ...thStyle, textAlign: "right" }}>총 클릭</th>
                <th style={thStyle}>OS별</th>
                <th style={{ ...thStyle, width: 60, textAlign: "center" }}>상세</th>
              </tr>
            </thead>
            <tbody>
              {data.list.map((item) => (
                <>
                  <tr
                    key={item.name}
                    style={{ borderBottom: "1px solid #e2e8f0", cursor: "pointer" }}
                    onClick={() => toggleExpand(item.name)}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: "#1a202c" }}>{item.nameLabel}</div>
                      <div style={{ fontSize: 11, color: "#a0aec0", fontFamily: "monospace" }}>{item.name}</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontSize: 15, color: "#2b6cb0" }}>
                      {item.totalCount.toLocaleString()}
                    </td>
                    <td style={tdStyle}>
                      <OsBar osCount={item.osCount} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", color: "#3182ce", fontSize: 16 }}>
                      {expanded.has(item.name) ? "▲" : "▼"}
                    </td>
                  </tr>
                  {expanded.has(item.name) && item.sources.map((src) => (
                    <tr key={`${item.name}_${src.source}`} style={{ background: "#f0f9ff", borderBottom: "1px solid #bee3f8" }}>
                      <td style={{ ...tdStyle, paddingLeft: 28 }}>
                        <div style={{ color: "#2c5282" }}>{src.sourceLabel}</div>
                        <div style={{ fontSize: 11, color: "#90cdf4", fontFamily: "monospace" }}>{src.source}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: "#2c5282" }}>
                        {src.count.toLocaleString()}
                      </td>
                      <td style={tdStyle}>
                        <OsBar osCount={src.osCount} />
                      </td>
                      <td style={tdStyle} />
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "8px 12px", textAlign: "left", fontSize: 12,
  fontWeight: 600, color: "#4a5568", borderBottom: "2px solid #e2e8f0",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px", verticalAlign: "middle",
};
