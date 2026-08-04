import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

interface SubjectVO {
  name: string;
}

type RequirementState = "needed" | "thinking" | "not_needed" | string;

interface LessonRequestItem {
  id: string;
  title: string;
  subjects: SubjectVO[] | null;
  user: { nickname: string } | null;
  liftAt: string | null;
  createdAt: string | null;
  requirementState: RequirementState | null;
}

const REQUIREMENT_STATE_META: Record<string, { label: string; color: string; bg: string }> = {
  needed:     { label: "과외급함",   color: "#c53030", bg: "rgba(229,62,62,0.1)" },
  thinking:   { label: "고민중",     color: "#b7791f", bg: "rgba(255,200,0,0.12)" },
  not_needed: { label: "모집 마감", color: "#718096", bg: "rgba(113,128,150,0.1)" },
};

function RequirementBadge({ state }: { state: RequirementState | null }) {
  if (!state) return null;
  const meta = REQUIREMENT_STATE_META[state] ?? { label: state, color: "#718096", bg: "rgba(113,128,150,0.1)" };
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      color: meta.color,
      background: meta.bg,
      borderRadius: 4,
      padding: "1px 6px",
      flexShrink: 0,
    }}>
      {meta.label}
    </span>
  );
}

function fmt(dt: string | null): string {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString("ko-KR", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dt;
  }
}

export function LessonRequestDateTab() {
  const [nickname, setNickname] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [requests, setRequests] = useState<LessonRequestItem[] | null>(null);

  const [selected, setSelected] = useState<LessonRequestItem | null>(null);
  const [dateType, setDateType] = useState<"created_at" | "lift_at">("created_at");
  const [days, setDays] = useState<string>("1");
  const [modifying, setModifying] = useState(false);
  const [modifyResult, setModifyResult] = useState<ResultState | null>(null);

  const { logout } = useAuth();
  const { env } = useEnv();
  const { show: showToast } = useToast();

  // ── 조회 ──────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) {
        setSearchError("닉네임을 입력해주세요.");
        return;
      }
      setSearching(true);
      setSearchError(null);
      setRequests(null);
      setSelected(null);
      setModifyResult(null);

      try {
        const r = await callProxy(
          "/admin/test/lesson/request/list",
          { nickname: nickname.trim() },
          { env },
        );
        if (r.ok) {
          const json = JSON.parse(r.body) as {
            isSuccess: boolean;
            systemMessage: string | null;
            requests?: LessonRequestItem[];
          };
          if (json.isSuccess) {
            setRequests(json.requests ?? []);
          } else {
            setSearchError(json.systemMessage ?? "조회 실패");
          }
        } else {
          setSearchError(`실패 (${r.status}) ${r.body}`);
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setSearchError(`오류: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setSearching(false);
      }
    },
    [nickname, env, logout],
  );

  // ── 날짜 수정 ─────────────────────────────────────────────────────────────
  const handleModify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selected) return;
      const daysNum = parseInt(days, 10);
      if (isNaN(daysNum) || daysNum < 1 || daysNum > 90) {
        setModifyResult({ ok: false, message: "날짜는 1~90 사이의 숫자여야 합니다." });
        return;
      }

      setModifying(true);
      setModifyResult(null);

      try {
        const r = await callProxy(
          "/admin/test/lesson/request/modify/date",
          { requestId: selected.id, type: dateType, date: String(daysNum) },
          { env },
        );
        if (r.ok) {
          const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
          if (json.isSuccess) {
            showToast("완료되었습니다");
            // 수정 후 자동 재조회
            setModifyResult(null);
            setSelected(null);
            setSearching(true);
            try {
              const r2 = await callProxy("/admin/test/lesson/request/list", { nickname: nickname.trim() }, { env });
              if (r2.ok) {
                const j2 = JSON.parse(r2.body) as { isSuccess: boolean; systemMessage: string | null; requests?: LessonRequestItem[] };
                if (j2.isSuccess) {
                  setRequests(j2.requests ?? []);
                  setModifyResult({ ok: true, message: "수정 완료! 목록을 새로 불러왔습니다." });
                } else {
                  setModifyResult({ ok: true, message: `수정 완료! (재조회 실패: ${j2.systemMessage ?? ""})` });
                }
              } else {
                setModifyResult({ ok: true, message: `수정 완료! (재조회 실패: ${r2.status})` });
              }
            } finally {
              setSearching(false);
            }
          } else {
            setModifyResult({ ok: false, message: json.systemMessage ?? "수정 실패" });
          }
        } else {
          setModifyResult({ ok: false, message: `실패 (${r.status}) ${r.body}` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setModifyResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setModifying(false);
      }
    },
    [selected, dateType, days, env, logout, showToast],
  );

  return (
    <div>
      <p className="page-title">모집공고 조회 및 날짜 수정</p>

      {/* ── STEP 1: 닉네임 조회 ───────────────────────────────────────────── */}
      <form className="section" onSubmit={(e) => void handleSearch(e)} noValidate>
        <p className="section-title">🔍 STEP 1 — 닉네임으로 모집공고 조회</p>
        <div className="field">
          <label htmlFor="lr_nickname">
            닉네임 <span className="required">*</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="lr_nickname"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-send" disabled={searching} style={{ width: "auto", padding: "0 20px" }}>
              {searching ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>
        {searchError && (
          <div className="result-box result-error" role="status">{searchError}</div>
        )}
      </form>

      {/* ── 조회 결과 목록 ─────────────────────────────────────────────────── */}
      {requests !== null && (
        <div className="section">
          <p className="section-title">
            📋 모집공고 목록 ({requests.length}건)
            {selected && (
              <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 12, color: "#3182ce" }}>
                ✔ 선택됨: {selected.title}
              </span>
            )}
          </p>

          {requests.length === 0 ? (
            <p style={{ fontSize: 13, color: "#718096" }}>모집공고가 없습니다.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requests.map((req) => {
                const isSelected = selected?.id === req.id;
                const subjectStr = req.subjects && req.subjects.length > 0
                  ? req.subjects.map((s) => s.name).join(", ")
                  : "-";
                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelected(req);
                      setModifyResult(null);
                      setDays("1");
                      setDateType("created_at");
                    }}
                    style={{
                      border: `2px solid ${isSelected ? "#3182ce" : "#e2e8f0"}`,
                      borderRadius: 8,
                      padding: "10px 14px",
                      cursor: "pointer",
                      background: isSelected ? "rgba(49,130,206,0.05)" : "transparent",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1a202c" }}>
                            {req.title}
                          </p>
                          <RequirementBadge state={req.requirementState} />
                        </div>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "#718096" }}>
                          과목: {subjectStr}
                        </p>
                      </div>
                      {isSelected && (
                        <span style={{ flexShrink: 0, fontSize: 18 }}>✔</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 13, color: "#1a202c" }}>
                      <span>생성일: {fmt(req.createdAt)}</span>
                      <span>끌올일: {fmt(req.liftAt)}</span>
                      <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10 }}>
                        {req.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: 날짜 수정 ─────────────────────────────────────────────── */}
      {selected && (
        <form className="section" onSubmit={(e) => void handleModify(e)} noValidate>
          <p className="section-title">✏️ STEP 2 — 날짜 수정</p>
          <p style={{ fontSize: 12, color: "#718096", marginBottom: 12 }}>
            선택된 공고: <strong>{selected.title}</strong>
          </p>

          <div className="field">
            <label>수정할 날짜 항목 <span className="required">*</span></label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {(
                [
                  { value: "created_at", label: "모집공고 생성일 (created_at)", desc: `현재: ${fmt(selected.createdAt)}` },
                  { value: "lift_at", label: "모집공고 끌올일 (lift_at)", desc: `현재: ${fmt(selected.liftAt)}` },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    border: `2px solid ${dateType === opt.value ? "#3182ce" : "#e2e8f0"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    background: dateType === opt.value ? "rgba(49,130,206,0.05)" : "transparent",
                    fontSize: 13,
                  }}
                >
                  <input
                    type="radio"
                    name="lr_date_type"
                    value={opt.value}
                    checked={dateType === opt.value}
                    onChange={() => setDateType(opt.value)}
                  />
                  <span>
                    <strong>{opt.label}</strong>
                    <span style={{ marginLeft: 8, fontSize: 13, color: "#1a202c" }}>{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="lr_days">
              오늘 기준 며칠 전으로 변경 <span className="required">*</span>
            </label>
            <input
              id="lr_days"
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              style={{ maxWidth: 120 }}
            />
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#1a202c" }}>
              현재 시각 기준으로 입력한 일수 전으로 설정됩니다. (1~90 사이)
            </p>
          </div>

          <button type="submit" className="btn btn-send" disabled={modifying}>
            {modifying ? "수정 중..." : "날짜 수정"}
          </button>

          <ResultBox result={modifyResult} />
        </form>
      )}
    </div>
  );
}
