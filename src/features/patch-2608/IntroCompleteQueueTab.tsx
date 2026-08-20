import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

// ── 타입 ─────────────────────────────────────────────────────────────────────
interface QueueItem {
  itemId: number | null;
  name: string | null;
  queueOrder: number | null;
  currentLap: number | null;
  isCompleted: boolean | null;
  isVisible: boolean | null;
  lastExposedAt: string | null;
  exposedCount: number | null;
}

interface Tier {
  tier: number | null;
  maxLaps: number;
  items: QueueItem[];
}

interface CompletionStatus {
  tutorId: string;
  isCompleted: boolean | null;
  tutorCompletion: number | null;
  classInfoCompletion: number | null;
  totalCount: number;
  completedCount: number;
  incompleteCount: number;
  tiers: Tier[] | null;
  waitingQueues: WaitingQueueVO[] | null;
  waitingPopupQueues: WaitingQueueVO[] | null;
}

interface WaitingQueueItemFields {
  name?: string | null;
  homeTitle?: string | null;
  homeSubTitle?: string | null;
  chatTitle?: string | null;
  chatSubTitle?: string | null;
  requestsTitle?: string | null;
  requestsSubTitle?: string | null;
  profileCardTitle?: string | null;
  popupTitle?: string | null;
  popupSubTitle?: string | null;
  popupButton?: string | null;
  allowNa?: boolean | null;
}

interface WaitingQueueVO extends WaitingQueueItemFields {
  item?: WaitingQueueItemFields;
}

function getField(q: WaitingQueueVO, key: keyof WaitingQueueItemFields): string | null | undefined {
  return (q[key] as string | null | undefined) ?? (q.item?.[key] as string | null | undefined);
}

function getBool(q: WaitingQueueVO, key: keyof WaitingQueueItemFields): boolean {
  const v = (q[key] as boolean | null | undefined) ?? (q.item?.[key] as boolean | null | undefined);
  return v === true;
}

// ── 헬퍼 UI ──────────────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number | null }) {
  const pct = value ?? 0;
  const color = pct >= 80 ? "#38a169" : pct >= 40 ? "#d69e2e" : "#e53e3e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 10, background: "#e2e8f0", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 5, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color, minWidth: 38, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function Badge({ ok }: { ok: boolean | null }) {
  if (ok === true)  return <span style={{ fontSize: 11, fontWeight: 700, color: "#276749", background: "rgba(39,103,73,0.1)", borderRadius: 4, padding: "1px 6px" }}>✓ 완료</span>;
  if (ok === false) return <span style={{ fontSize: 11, fontWeight: 700, color: "#c53030", background: "rgba(197,48,48,0.08)", borderRadius: 4, padding: "1px 6px" }}>✗ 미완료</span>;
  return <span style={{ fontSize: 11, color: "#a0aec0" }}>-</span>;
}

function VisibleBadge({ v }: { v: boolean | null }) {
  if (v === true)  return <span style={{ fontSize: 10, color: "#2b6cb0", background: "rgba(43,108,176,0.1)", borderRadius: 3, padding: "1px 5px" }}>노출중</span>;
  if (v === false) return <span style={{ fontSize: 10, color: "#718096", background: "#edf2f7", borderRadius: 3, padding: "1px 5px" }}>숨김</span>;
  return null;
}

function fmtDate(dt: string | null) {
  if (!dt) return "-";
  try { return new Date(dt).toLocaleString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return dt; }
}

const HIGH_DIFFICULTY_NAMES = new Set([
  "tutor_video", "tutor_simple_introduction", "tutor_achievement",
  "tutor_subject_description", "tutor_session_plan", "tutor_differentiation",
  "tutor_appeal", "tutor_university_passnote", "tutor_tip",
  "tutor_experience", "tutor_business_doc", "tutor_academy_career",
  "tutor_etc_career",
]);

// ── 메인 ─────────────────────────────────────────────────────────────────────
export function IntroCompleteQueueTab() {
  const [nickname, setNickname] = useState("");
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [status, setStatus] = useState<CompletionStatus | null>(null);

  // 각 액션별 결과
  const [settingResult, setSettingResult] = useState<ResultState | null>(null);
  const [resetResult, setResetResult] = useState<ResultState | null>(null);
  const [logResetResult, setLogResetResult] = useState<ResultState | null>(null);
  const [busy, setBusy] = useState<"setting" | "reset" | "logReset" | null>(null);

  const { logout } = useAuth();
  const { env } = useEnv();
  const { show: showToast } = useToast();

  // ── 조회 ──────────────────────────────────────────────────────────────────
  const doQuery = useCallback(async (nick: string) => {
    setQuerying(true);
    setQueryError(null);
    setStatus(null);
    try {
      const r = await callProxy("/admin/test/get/tutor/completion", { nickname: nick }, { env });
      if (r.ok) {
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; data?: CompletionStatus };
        if (json.isSuccess && json.data) {
          setStatus(json.data);
        } else {
          setQueryError(json.systemMessage ?? "조회 실패");
        }
      } else {
        setQueryError(`실패 (${r.status}) ${r.body}`);
      }
    } catch (e) {
      if (e instanceof UnauthenticatedError) { await logout(); return; }
      setQueryError(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setQuerying(false);
    }
  }, [env, logout]);

  const handleQuery = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) { setQueryError("닉네임을 입력해주세요."); return; }
    await doQuery(nickname.trim());
  }, [nickname, doQuery]);

  // ── 액션 공통 ─────────────────────────────────────────────────────────────
  const doAction = useCallback(async (
    path: string,
    busyKey: "setting" | "reset" | "logReset",
    setResult: (r: ResultState) => void,
  ) => {
    if (!nickname.trim()) { setResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }
    setBusy(busyKey);
    setResult({ ok: true, message: "" }); // clear
    try {
      const r = await callProxy(path, { nickname: nickname.trim() }, { env });
      if (r.ok) {
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (json.isSuccess) {
          showToast("완료되었습니다");
          setResult({ ok: true, message: json.systemMessage || "완료" });
          await doQuery(nickname.trim());
        } else {
          setResult({ ok: false, message: json.systemMessage ?? "실패" });
        }
      } else {
        setResult({ ok: false, message: `실패 (${r.status}) ${r.body}` });
      }
    } catch (e) {
      if (e instanceof UnauthenticatedError) { await logout(); return; }
      setResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(null);
    }
  }, [nickname, env, logout, showToast, doQuery]);

  return (
    <div>
      <p className="page-title">소개서 완성 큐</p>
      <p className="page-subtitle">튜터 소개서 완성 큐 현황을 조회하고 테스트 상태를 관리합니다.</p>

      {/* ── 닉네임 입력 (공유) ────────────────────────────────────────────── */}
      <form className="section" onSubmit={(e) => void handleQuery(e)} noValidate>
        <p className="section-title">닉네임 입력</p>
        <div className="field">
          <label htmlFor="icq_nickname">닉네임 <span className="required">*</span></label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="icq_nickname"
              type="text"
              placeholder="튜터 닉네임 입력"
              autoComplete="off"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-send" disabled={querying} style={{ width: "auto", padding: "0 20px" }}>
              {querying ? "조회 중..." : "🔍 큐 조회"}
            </button>
          </div>
        </div>
        {queryError && <div className="result-box result-error" role="status">{queryError}</div>}
      </form>

      {/* ── 조회 결과 ─────────────────────────────────────────────────────── */}
      {status && (
        <div className="section">
          <p className="section-title">📊 소개서 완성 현황</p>

          {/* 완성도 + 요약 */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            {/* 완성 여부 */}
            <div style={{ padding: "10px 16px", border: "1.5px solid #e2e8f0", borderRadius: 8, minWidth: 120, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 11, color: "#718096" }}>완성 여부</p>
              <p style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 700, color: status.isCompleted ? "#276749" : "#c53030" }}>
                {status.isCompleted ? "✅ 완성" : "❌ 미완성"}
              </p>
            </div>
            {/* 큐 개수 */}
            <div style={{ padding: "10px 16px", border: "1.5px solid #e2e8f0", borderRadius: 8, minWidth: 160 }}>
              <p style={{ margin: 0, fontSize: 11, color: "#718096" }}>큐 현황</p>
              <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 700, color: "#1a202c" }}>
                전체 {status.totalCount}개
                <span style={{ fontSize: 12, fontWeight: 400, color: "#276749", marginLeft: 8 }}>완료 {status.completedCount}</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: "#c53030", marginLeft: 6 }}>미완료 {status.incompleteCount}</span>
              </p>
            </div>
          </div>

          {/* 완성도 바 */}
          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#4a5568" }}>튜터 소개서 완성도 (tutorCompletion)</span>
              </div>
              <ProgressBar value={status.tutorCompletion} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#4a5568" }}>수업 정보 완성도 (classInfoCompletion)</span>
              </div>
              <ProgressBar value={status.classInfoCompletion} />
            </div>
          </div>

          {/* Tier별 큐 목록 */}
          {status.tiers && status.tiers.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#2d3748" }}>📋 Tier별 큐 목록</p>
              {status.tiers.map((tier) => (
                <div key={tier.tier} style={{ marginBottom: 10, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ background: "#f7fafc", padding: "6px 12px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2d3748" }}>Tier {tier.tier}</span>
                    <span style={{ fontSize: 11, color: "#718096" }}>최대 {tier.maxLaps}랩</span>
                    <span style={{ fontSize: 11, color: "#276749" }}>완료 {tier.items?.filter(i => i.isCompleted).length ?? 0}</span>
                    <span style={{ fontSize: 11, color: "#c53030" }}>미완료 {tier.items?.filter(i => !i.isCompleted).length ?? 0}</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f7fafc" }}>
                        <th style={{ padding: "5px 10px", textAlign: "left", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>항목명</th>
                        <th style={{ padding: "5px 10px", textAlign: "center", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>난이도</th>
                        <th style={{ padding: "5px 10px", textAlign: "center", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>완료</th>
                        <th style={{ padding: "5px 10px", textAlign: "center", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>노출</th>
                        <th style={{ padding: "5px 10px", textAlign: "center", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>랩/순서</th>
                        <th style={{ padding: "5px 10px", textAlign: "center", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>노출횟수</th>
                        <th style={{ padding: "5px 10px", textAlign: "right", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>마지막노출</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tier.items?.map((item, idx) => (
                        <tr key={item.itemId ?? idx} style={{ borderBottom: "1px solid #f0f0f0", background: item.isCompleted ? "rgba(39,103,73,0.03)" : "transparent" }}>
                          <td style={{ padding: "6px 10px", fontWeight: 600, color: "#1a202c" }}>{item.name ?? "-"}</td>
                          <td style={{ padding: "6px 10px", textAlign: "center" }}>
                            {item.name ? (
                              <span style={{
                                fontSize: 10, fontWeight: 700,
                                color: HIGH_DIFFICULTY_NAMES.has(item.name) ? "#c53030" : "#276749",
                                background: HIGH_DIFFICULTY_NAMES.has(item.name) ? "rgba(197,48,48,0.08)" : "rgba(39,103,73,0.08)",
                                borderRadius: 4, padding: "2px 6px",
                              }}>
                                {HIGH_DIFFICULTY_NAMES.has(item.name) ? "상" : "하"}
                              </span>
                            ) : "-"}
                          </td>
                          <td style={{ padding: "6px 10px", textAlign: "center" }}><Badge ok={item.isCompleted} /></td>
                          <td style={{ padding: "6px 10px", textAlign: "center" }}><VisibleBadge v={item.isVisible} /></td>
                          <td style={{ padding: "6px 10px", textAlign: "center", color: "#4a5568" }}>
                            {item.currentLap ?? "-"}랩 / {item.queueOrder ?? "-"}순
                          </td>
                          <td style={{ padding: "6px 10px", textAlign: "center", color: "#4a5568" }}>{item.exposedCount ?? 0}회</td>
                          <td style={{ padding: "6px 10px", textAlign: "right", color: "#718096", fontFamily: "monospace", fontSize: 11 }}>{fmtDate(item.lastExposedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* 앱·웹에 노출되는 소개서 완성 유도 아이템 */}
          {(() => {
            const qs = status.waitingQueues ?? [];
            if (qs.length === 0) return (
              <div>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#2d3748" }}>📱 앱·웹에 노출되는 소개서 완성 유도 아이템 정보</p>
                <p style={{ fontSize: 13, color: "#718096" }}>노출되는 아이템 없음</p>
              </div>
            );

            const sectionLabel = (label: string, count: number, unit: "상위" | "최대" = "상위") => (
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#718096", letterSpacing: 1 }}>
                {label} <span style={{ fontWeight: 400 }}>({unit} {count}개)</span>
              </p>
            );

            const DifficultyBadge = ({ q }: { q: WaitingQueueVO }) => {
              const name = getField(q, "name");
              const isHigh = name ? HIGH_DIFFICULTY_NAMES.has(name) : false;
              return (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: isHigh ? "#c53030" : "#276749",
                  background: isHigh ? "rgba(197,48,48,0.08)" : "rgba(39,103,73,0.08)",
                  borderRadius: 4, padding: "1px 6px",
                }}>
                  난이도 : {isHigh ? "상" : "하"}
                </span>
              );
            };

            const TIER_COLORS: Record<number, { bg: string; color: string }> = {
              1: { bg: "#e9d8fd", color: "#6b21a8" },
              2: { bg: "#bee3f8", color: "#1d4ed8" },
              3: { bg: "#c6f6d5", color: "#276749" },
              4: { bg: "#fefcbf", color: "#b7791f" },
              5: { bg: "#fed7d7", color: "#c53030" },
            };

            // name으로 tier 번호 찾기
            const getTier = (q: WaitingQueueVO): number | null => {
              const name = getField(q, "name");
              if (!name || !status.tiers) return null;
              for (const tier of status.tiers) {
                if (tier.items?.some((item) => item.name === name)) return tier.tier;
              }
              return null;
            };

            const TierBadge = ({ q }: { q: WaitingQueueVO }) => {
              const tier = getTier(q);
              if (tier === null) return null;
              const c = TIER_COLORS[tier] ?? { bg: "#e2e8f0", color: "#4a5568" };
              return (
                <span style={{ fontSize: 11, fontWeight: 800, color: c.color, background: c.bg, borderRadius: 5, padding: "2px 8px" }}>
                  Tier {tier}
                </span>
              );
            };

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#2d3748" }}>
                  📱 앱·웹에 노출되는 소개서 완성 유도 아이템 정보
                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "#718096" }}>{qs.length}개</span>
                </p>

                {/* ── 🏠 홈: 상위 2개 좌우 ──────────────────────────────── */}
                <div>
                  {sectionLabel("🏠 홈", Math.min(2, qs.length))}
                  <div style={{ display: "flex", gap: 10 }}>
                    {qs.slice(0, 2).map((q, i) => (
                      <div key={i} style={{ flex: 1, background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 11, color: "#a0aec0" }}>#{i + 1} {getField(q, "name")}</p>
                        {getField(q, "homeTitle") && <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a202c" }}>{getField(q, "homeTitle")}</p>}
                        {getField(q, "homeSubTitle") && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#4a5568" }}>{getField(q, "homeSubTitle")}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 💬 채팅 / 공고목록: 상위 1개, sub 위 · title 아래 ── */}
                <div>
                  {sectionLabel("💬 채팅 / 📋 공고목록", 1)}
                  {qs[0] && (() => {
                    const q = qs[0];
                    const title = getField(q, "chatTitle") ?? getField(q, "requestsTitle");
                    const sub   = getField(q, "chatSubTitle") ?? getField(q, "requestsSubTitle");
                    if (!title && !sub) return null;
                    return (
                      <div style={{ background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          {sub   && <p style={{ margin: 0, fontSize: 11, color: "#718096" }}>{sub}</p>}
                          {title && <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: "#1a202c" }}>{title}</p>}
                        </div>
                        <span style={{ color: "#a0aec0", fontSize: 16 }}>›</span>
                      </div>
                    );
                  })()}
                </div>

                {/* ── 🪪 프로필 카드: 상위 1개, 빨간 글씨 ──────────────── */}
                <div>
                  {sectionLabel("🪪 프로필 카드", 1)}
                  {qs[0] && getField(qs[0], "profileCardTitle") && (
                    <div style={{ background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e53e3e" }}>
                        {getField(qs[0], "profileCardTitle")}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── 🔔 팝업: 상위 3개 좌우 ───────────────────────────── */}
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#718096", letterSpacing: 1 }}>🔔 팝업</p>
                  <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                    {(status.waitingPopupQueues ?? []).slice(0, 3).map((q, i) => (
                      <div key={i} style={{ width: "calc(33.333% - 7px)", flexShrink: 0, background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                          <TierBadge q={q} />
                          <DifficultyBadge q={q} />
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: "#a0aec0" }}>#{i + 1} {getField(q, "name")}</p>
                        {getField(q, "popupTitle") && <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a202c" }}>{getField(q, "popupTitle")}</p>}
                        {getField(q, "popupSubTitle") && <p style={{ margin: 0, fontSize: 11, color: "#4a5568" }}>{getField(q, "popupSubTitle")}</p>}
                        {getField(q, "popupButton") && (
                          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                            <div style={{ background: "#4fd1c5", color: "#fff", fontWeight: 700, fontSize: 12, borderRadius: 8, padding: "7px 16px", boxSizing: "border-box" }}>
                              {getField(q, "popupButton")}
                            </div>
                            {getBool(q, "allowNa") && (
                              <div style={{ background: "#e2e8f0", color: "#718096", fontWeight: 600, fontSize: 12, borderRadius: 8, padding: "7px 16px", boxSizing: "border-box" }}>
                                해당사항이 없어요
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      )}

      {/* ── 액션 버튼 3개 ─────────────────────────────────────────────────── */}
      <div className="section">
        <p className="section-title">⚙️ 큐 관리</p>
        <p style={{ fontSize: 12, color: "#718096", marginBottom: 14 }}>
          위에서 닉네임 입력 후 각 버튼을 누르면 해당 액션이 실행되고 자동으로 재조회됩니다.
        </p>

        {/* 큐 없는 경우 세팅 */}
        <div style={{ marginBottom: 14, padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a202c" }}>큐 없는 경우 세팅하기</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#718096" }}>처음 실행하거나 큐가 없을 때 초기 세팅합니다.</p>
            </div>
            <button
              type="button"
              className="btn btn-send"
              disabled={busy !== null}
              style={{ width: "auto", padding: "0 20px" }}
              onClick={() => void doAction("/admin/test/setting/tutor/completion", "setting", setSettingResult)}
            >
              {busy === "setting" ? "처리 중..." : "세팅"}
            </button>
          </div>
          <ResultBox result={settingResult?.message ? settingResult : null} />
        </div>

        {/* 큐 초기화 후 재세팅 */}
        <div style={{ marginBottom: 14, padding: "12px 14px", border: "1px solid #fed7d7", borderRadius: 8, background: "rgba(254,215,215,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#c53030" }}>큐 초기화하여 다시 세팅</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#718096" }}>기존 큐를 초기화하고 다시 세팅합니다.</p>
            </div>
            <button
              type="button"
              className="btn"
              disabled={busy !== null}
              style={{ width: "auto", padding: "0 20px", background: "#e53e3e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              onClick={() => void doAction("/admin/test/reset/tutor/completion", "reset", setResetResult)}
            >
              {busy === "reset" ? "처리 중..." : "초기화 후 재세팅"}
            </button>
          </div>
          <ResultBox result={resetResult?.message ? resetResult : null} />
        </div>

        {/* 팝업 기록 초기화 */}
        <div style={{ padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a202c" }}>팝업 봤다는 기록 초기화</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#718096" }}>tutorCompletion 타입의 user_send_log를 삭제합니다.</p>
            </div>
            <button
              type="button"
              className="btn"
              disabled={busy !== null}
              style={{ width: "auto", padding: "0 20px", background: "#718096", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              onClick={() => void doAction("/admin/test/reset/tutor/completion/log", "logReset", setLogResetResult)}
            >
              {busy === "logReset" ? "처리 중..." : "팝업 기록 초기화"}
            </button>
          </div>
          <ResultBox result={logResetResult?.message ? logResetResult : null} />
        </div>
      </div>
    </div>
  );
}
