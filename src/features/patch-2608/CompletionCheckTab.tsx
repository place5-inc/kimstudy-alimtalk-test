import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

// ── 타입 ──────────────────────────────────────────────────────
interface CompletionItem {
  key: string;
  label: string;
  earned: number;
  max: number;
  missed: number;
  status: string;
  inUnfilledItems: boolean;
  detail: string;
}

interface CompletionSection {
  title: string;
  storedScore: number;
  actualScore: number;
  breakdownSum: number;
  matched: boolean;
  isCompleted: boolean;
  unfilledItems: string[];
  items: CompletionItem[];
}

interface MultiProfile {
  profileId?: string;
  profileName?: string;
  classInfoCompletion: CompletionSection;
}

interface CompletionData {
  userId: string;
  nickname: string;
  classMode: string;
  tutorCompletion: CompletionSection;
  baseClassInfoCompletion: CompletionSection;
  multiProfiles: MultiProfile[];
}

interface ApiResponse {
  isSuccess: boolean;
  systemMessage: string | null;
  data?: CompletionData;
}

// ── 상태 색상 ─────────────────────────────────────────────────
function statusStyle(status: string, inUnfilled: boolean): React.CSSProperties {
  if (status === "만점")               return { color: "#276749", fontWeight: 700 };
  if (status === "0점")                return { color: "#c53030", fontWeight: 700 };
  if (status === "일부")               return { color: "#b7791f", fontWeight: 700 };
  if (status.startsWith("점수없음"))   return { color: inUnfilled ? "#c53030" : "#718096" };
  return { color: "#4a5568" };
}

function rowBg(item: CompletionItem): string {
  if (item.status === "만점" && !item.inUnfilledItems) return "transparent";
  if (item.missed > 0 || item.inUnfilledItems)         return "#fff5f5";
  return "transparent";
}

// ── 점수 섹션 ─────────────────────────────────────────────────
function ScoreHeader({ section }: { section: CompletionSection }) {
  const mismatch = !section.matched;
  const totalMissed = section.items.reduce((s, it) => s + it.missed, 0);
  const missedItems = section.items.filter((it) => it.missed > 0);
  return (
    <div style={{ marginBottom: 14 }}>
      {/* 점수 요약 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "12px 16px",
        background: section.isCompleted ? "#f0fff4" : "#fffbeb",
        border: `1px solid ${section.isCompleted ? "#9ae6b4" : "#f6e05e"}`,
        borderRadius: 8, marginBottom: totalMissed > 0 ? 8 : 0,
      }}>
        <div>
          <span style={{ fontSize: 24, fontWeight: 800, color: section.isCompleted ? "#276749" : "#b7791f" }}>
            {section.actualScore}점
          </span>
          <span style={{ fontSize: 12, color: "#718096", marginLeft: 8 }}>
            저장값 {section.storedScore}점 / 합산 {section.breakdownSum}점
          </span>
        </div>
        {totalMissed > 0 && (
          <div style={{ fontSize: 13, color: "#c53030", fontWeight: 700 }}>
            −{totalMissed}점 손실
          </div>
        )}
        {mismatch && (
          <span style={{ fontSize: 12, color: "#c53030", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 4, padding: "2px 8px" }}>
            ⚠️ 저장값 ≠ 실제 계산값 불일치
          </span>
        )}
        <span style={{
          fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 12,
          background: section.isCompleted ? "#c6f6d5" : "#feebc8",
          color: section.isCompleted ? "#276749" : "#c05621",
        }}>
          {section.isCompleted ? "✓ 완성" : "미완성"}
        </span>
      </div>
      {/* 못 받은 항목 요약 */}
      {missedItems.length > 0 && (
        <div style={{
          padding: "10px 14px", background: "#fff5f5",
          border: "1px solid #fed7d7", borderRadius: 8,
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#c53030" }}>
            ❌ 점수를 받지 못한 항목 ({missedItems.length}개, 총 −{totalMissed}점)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {missedItems.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 12 }}>
                <span style={{ color: "#c53030", fontWeight: 700, minWidth: 40 }}>−{it.missed}점</span>
                <span style={{ color: "#2d3748", fontWeight: 600 }}>{it.label}</span>
                <span style={{ color: "#718096", fontSize: 11 }}>{it.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemsTable({ items }: { items: CompletionItem[] }) {
  const scored   = items.filter((it) => it.max > 0);
  const unscored = items.filter((it) => it.max === 0);

  const renderRows = (rows: CompletionItem[]) => rows.map((item, i) => (
    <tr key={i} style={{ background: rowBg(item), borderBottom: "1px solid #e2e8f0" }}>
      <td style={td}>
        <span style={{ fontWeight: item.missed > 0 || item.inUnfilledItems ? 700 : 400 }}>
          {item.label}
        </span>
        {item.inUnfilledItems && (
          <span style={{ marginLeft: 6, fontSize: 10, color: "#c53030", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 4, padding: "1px 5px" }}>
            미충족
          </span>
        )}
      </td>
      <td style={{ ...td, textAlign: "center", fontFamily: "monospace" }}>
        <span>
          <span style={{ fontWeight: 700, color: item.earned === item.max ? "#276749" : item.earned === 0 ? "#c53030" : "#b7791f" }}>
            {item.earned}
          </span>
          <span style={{ color: "#a0aec0" }}>/{item.max}</span>
          {item.missed > 0 && (
            <span style={{ marginLeft: 4, fontSize: 10, color: "#c53030" }}>(−{item.missed})</span>
          )}
        </span>
      </td>
      <td style={{ ...td, textAlign: "center", ...statusStyle(item.status, item.inUnfilledItems) }}>
        {item.status}
      </td>
      <td style={{ ...td, color: "#4a5568", fontSize: 11 }}>{item.detail}</td>
    </tr>
  ));

  return (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: unscored.length > 0 ? 12 : 0 }}>
        <thead>
          <tr style={{ background: "#f7fafc" }}>
            <th style={th}>항목</th>
            <th style={{ ...th, textAlign: "center", width: 90 }}>점수 (손실)</th>
            <th style={{ ...th, textAlign: "center", width: 80 }}>상태</th>
            <th style={th}>근거</th>
          </tr>
        </thead>
        <tbody>{renderRows(scored)}</tbody>
      </table>
      {unscored.length > 0 && (
        <details style={{ marginTop: 4 }}>
          <summary style={{ fontSize: 12, color: "#718096", cursor: "pointer", padding: "4px 0" }}>
            점수 없는 항목 (완성여부만) {unscored.length}개 보기
          </summary>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 6 }}>
            <thead>
              <tr style={{ background: "#f7fafc" }}>
                <th style={th}>항목</th>
                <th style={{ ...th, textAlign: "center", width: 80 }}>완성여부</th>
                <th style={th}>근거</th>
              </tr>
            </thead>
            <tbody>
              {unscored.map((item, i) => (
                <tr key={i} style={{ background: item.inUnfilledItems ? "#fff5f5" : "transparent", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={td}>
                    {item.label}
                    {item.inUnfilledItems && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: "#c53030", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 4, padding: "1px 5px" }}>
                        미충족
                      </span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "center", ...statusStyle(item.status, item.inUnfilledItems) }}>
                    {item.inUnfilledItems ? "미완성" : "완성"}
                  </td>
                  <td style={{ ...td, color: "#4a5568", fontSize: 11 }}>{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </>
  );
}

function Section({ section, defaultOpen = false }: { section: CompletionSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section" style={{ marginBottom: 12 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <p className="section-title" style={{ margin: 0, fontSize: 13 }}>{section.title}</p>
        <span style={{ color: "#3182ce", fontSize: 14 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <ScoreHeader section={section} />
          <ItemsTable items={section.items} />
        </div>
      )}
    </div>
  );
}

// ── 메인 탭 ──────────────────────────────────────────────────
export function CompletionCheckTab() {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy]         = useState(false);
  const [result, setResult]     = useState<ResultState | null>(null);
  const [data, setData]         = useState<CompletionData | null>(null);

  const { logout } = useAuth();
  const { env }    = useEnv();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }
      setBusy(true);
      setResult(null);
      setData(null);
      try {
        const r = await callProxy("/admin/test/check/completion", { nickname: nickname.trim() }, { env });
        if (!r.body.trim()) { setResult({ ok: false, message: `빈 응답 (${r.status})` }); return; }
        const json = JSON.parse(r.body) as ApiResponse;
        if (json.isSuccess && json.data) {
          setData(json.data);
          setResult({ ok: true, message: `${json.data.nickname} 조회 완료` });
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
    [nickname, env, logout],
  );

  return (
    <div>
      <p className="page-title">완성도 계산 근거 확인</p>
      <p className="page-subtitle">선생님 정보 완성도 / 수업 안내 완성도의 항목별 점수 계산 근거를 확인합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className="field">
          <label htmlFor="cc_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="cc_nickname"
            type="text"
            placeholder="선생님 닉네임"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "조회 중..." : "확인"}
        </button>
        <ResultBox result={result} />
      </form>

      {data && (
        <>
          {/* 기본 정보 */}
          <div className="section" style={{ marginBottom: 12, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
            <span><b>닉네임</b>: {data.nickname}</span>
            <span><b>수업 방식</b>: {data.classMode}</span>
            <span style={{ color: "#a0aec0", fontSize: 11, fontFamily: "monospace" }}>{data.userId}</span>
          </div>

          {/* 선생님 정보 완성도 */}
          <Section section={data.tutorCompletion} defaultOpen={true} />

          {/* 기본소개서 수업 안내 완성도 */}
          <Section section={data.baseClassInfoCompletion} defaultOpen={true} />

          {/* 멀티소개서 */}
          {data.multiProfiles.length > 0 && data.multiProfiles.map((mp, i) => (
            <Section
              key={mp.profileId ?? i}
              section={mp.classInfoCompletion}
              defaultOpen={false}
            />
          ))}
          {data.multiProfiles.length === 0 && (
            <div className="section" style={{ color: "#a0aec0", fontSize: 13 }}>멀티소개서 없음</div>
          )}
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "7px 10px", textAlign: "left", fontSize: 11,
  fontWeight: 600, color: "#4a5568", borderBottom: "2px solid #e2e8f0",
};
const td: React.CSSProperties = {
  padding: "8px 10px", verticalAlign: "top",
};
