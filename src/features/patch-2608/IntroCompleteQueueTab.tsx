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
  profile?: { id: string } | null;
  classInfo?: { key: string } | null;
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

// '노출' 컬럼과 한 쌍 — 컬럼 되살릴 때 같이 풀기.
// function VisibleBadge({ v }: { v: boolean | null }) {
//   if (v === true)  return <span style={{ fontSize: 10, color: "#2b6cb0", background: "rgba(43,108,176,0.1)", borderRadius: 3, padding: "1px 5px" }}>노출중</span>;
//   if (v === false) return <span style={{ fontSize: 10, color: "#718096", background: "#edf2f7", borderRadius: 3, padding: "1px 5px" }}>숨김</span>;
//   return null;
// }

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

// 서버는 항목명을 tutor_video 같은 영문 키로 보내옴. super-kimstudy-web 의
// components/completionItems 에 있는 label 을 그대로 옮겨, 큐 화면에서 사람이 알아보게 함.
// (프론트에서 label 이 바뀌면 여기도 맞춰줌)
const NAME_LABELS: Record<string, string> = {
  tutor_lesson_requirement_state: "과외 구함 상태",
  tutor_video: "수업 영상",
  tutor_simple_introduction: "수업 간단 소개",
  tutor_achievement: "수업 성과",
  tutor_offline_class_description: "대면과외 수업 방식",
  tutor_online_class_description: "화상과외 수업방식",
  tutor_subject_specialty_point: "특히 자신있는 파트",
  tutor_possible_format: "수업 가능 유형",
  tutor_possible_time: "수업 가능 일정",
  tutor_demo_class: "시범과외",
  tutor_demo_class_impossible: "시범과외",
  tutor_address_priority: "주요 대면과외 지역",
  tutor_possible_school: "주요 수업 가능학교",
  tutor_confident_type: "자신있는 학생 유형",
  tutor_subject_description: "과목별 수업 내용",
  tutor_possible_language: "수업가능 언어",
  tutor_session_plan: "한 회차 수업 계획",
  tutor_text_book: "주요 수업 교재",
  tutor_possible_online_course: "연계 가능 인강",
  tutor_possible_academy: "연계 가능 학원",
  tutor_feedback: "피드백 방식",
  tutor_homework_management: "숙제 관리 방식",
  tutor_extra_service: "본 수업 외 제공 항목",
  tutor_differentiation: "차별점",
  tutor_appeal: "어필",
  tutor_highschool: "출신 고교",
  tutor_middleschool: "출신 중학교",
  tutor_university_passnote: "대학 합격 수기",
  tutor_tip: "나만의 공부법",
  tutor_experience: "기타 경험",
  tutor_mbti: "MBTI",
  tutor_business_doc: "과외 영업 서류 인증",
  tutor_document: "요청 시 제공 서류",
  tutor_academy_career: "학원 경력",
  tutor_etc_career: "기타 경력",
};

// 항목명을 한글 라벨 아래 원본 키 두 줄로 보여줌. 매핑에 없는 키는 원본 키를 그대로 둬서 정보가 사라지지 않게 함.
function ItemName({ name }: { name: string | null | undefined }) {
  if (!name) return <>-</>;
  const label = NAME_LABELS[name];
  if (!label) return <span style={{ fontWeight: 600 }}>{name}</span>;
  return (
    <span style={{ display: "inline-block" }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <br />
      <span style={{ fontSize: 10, fontWeight: 400, color: "#a0aec0", fontFamily: "monospace" }}>({name})</span>
    </span>
  );
}

// ── 상태별 접기/펼치기 카드 ───────────────────────────────────────────────────
function CollapsibleStatusCard({
  status,
  statusIdx,
  isActive,
  children,
}: {
  status: CompletionStatus;
  statusIdx: number;
  isActive: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!status.isCompleted);
  const isBaseProfile = !status.profile?.id;
  const profileLabel = isBaseProfile ? "📄 기본소개서" : `📋 멀티소개서 #${statusIdx}`;

  return (
    <div className="section" style={{ padding: 0, overflow: "hidden" }}>
      {/* 헤더 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", textAlign: "left", padding: "10px 16px",
          background: isBaseProfile ? "#ebf8ff" : "#f0fff4",
          border: "none", borderBottom: open ? `1px solid ${isBaseProfile ? "#90cdf4" : "#9ae6b4"}` : "none",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2d3748" }}>
          📊 소개서 완성 현황
        </span>
        <span style={{
          fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 12,
          background: isBaseProfile ? "#bee3f8" : "#c6f6d5",
          color: isBaseProfile ? "#2b6cb0" : "#276749",
          border: `1px solid ${isBaseProfile ? "#90cdf4" : "#9ae6b4"}`,
        }}>
          {profileLabel}
        </span>
        {isActive && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#c53030", background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 10, padding: "2px 8px" }}>
            🔴 현재 노출중
          </span>
        )}
        {status.isCompleted && (
          <span style={{ fontSize: 11, color: "#276749", background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 10, padding: "2px 8px" }}>
            ✅ 소개서 완성 (배너·팝업 미노출)
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#718096" }}>{open ? "▲ 접기" : "▼ 펼치기"}</span>
      </button>

      {/* 콘텐츠 */}
      {open && <div style={{ padding: "16px" }}>{children}</div>}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export function IntroCompleteQueueTab() {
  const [nickname, setNickname] = useState("");
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [statusList, setStatusList] = useState<CompletionStatus[] | null>(null);

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
    setStatusList(null);
    try {
      const r = await callProxy("/admin/test/get/tutor/completion", { nickname: nick }, { env });
      if (r.ok) {
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; data?: CompletionStatus[] };
        if (json.isSuccess && json.data) {
          setStatusList(json.data);
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

  const setupQueue = () => void doAction("/admin/test/setting/tutor/completion", "setting", setSettingResult);
  const resetQueue = () => void doAction("/admin/test/reset/tutor/completion", "reset", setResetResult);
  const clearPopupLog = () => void doAction("/admin/test/reset/tutor/completion/log", "logReset", setLogResetResult);

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

      {/* ── 큐 관리 (액션 3개, 한 줄) ──────────────────────────────────────── */}
      <div className="section">
        <p className="section-title">⚙️ 큐 관리</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <button
              type="button"
              className="btn btn-send"
              disabled={busy !== null}
              style={{ width: "100%" }}
              onClick={setupQueue}
            >
              {busy === "setting" ? "처리 중..." : "큐 세팅"}
            </button>
            <p style={{ margin: "6px 2px 0", fontSize: 11, color: "#718096", lineHeight: 1.4 }}>처음 실행하거나 큐가 없을 때 초기 세팅</p>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <button
              type="button"
              className="btn"
              disabled={busy !== null}
              style={{ width: "100%", background: "#e53e3e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              onClick={resetQueue}
            >
              {busy === "reset" ? "처리 중..." : "초기화 후 재세팅"}
            </button>
            <p style={{ margin: "6px 2px 0", fontSize: 11, color: "#718096", lineHeight: 1.4 }}>기존 큐를 초기화하고 다시 세팅</p>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <button
              type="button"
              className="btn"
              disabled={busy !== null}
              style={{ width: "100%", background: "#718096", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              onClick={clearPopupLog}
            >
              {busy === "logReset" ? "처리 중..." : "팝업 기록 초기화"}
            </button>
            <p style={{ margin: "6px 2px 0", fontSize: 11, color: "#718096", lineHeight: 1.4 }}>tutorCompletion 타입 user_send_log 삭제</p>
          </div>
        </div>
        <ResultBox result={settingResult?.message ? settingResult : null} />
        <ResultBox result={resetResult?.message ? resetResult : null} />
        <ResultBox result={logResetResult?.message ? logResetResult : null} />
      </div>

      {/* ── 조회 결과 ─────────────────────────────────────────────────────── */}
      {statusList && (() => {
        const firstActiveIdx = statusList.findIndex((s) => !s.isCompleted);
        return statusList.map((status, statusIdx) => (
        <CollapsibleStatusCard key={statusIdx} status={status} statusIdx={statusIdx} isActive={statusIdx === firstActiveIdx}>

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
                        {/* <th style={{ padding: "5px 10px", textAlign: "center", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>노출</th> */}
                        <th style={{ padding: "5px 10px", textAlign: "center", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>랩/순서</th>
                        <th style={{ padding: "5px 10px", textAlign: "center", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>노출횟수</th>
                        <th style={{ padding: "5px 10px", textAlign: "right", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>마지막노출</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tier.items?.map((item, idx) => (
                        <tr key={item.itemId ?? idx} style={{ borderBottom: "1px solid #f0f0f0", background: item.isCompleted ? "rgba(39,103,73,0.03)" : "transparent" }}>
                          <td style={{ padding: "6px 10px", color: "#1a202c" }}><ItemName name={item.name} /></td>
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
                          {/* <td style={{ padding: "6px 10px", textAlign: "center" }}><VisibleBadge v={item.isVisible} /></td> */}
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
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "#e53e3e", fontWeight: 600 }}>
                  ※ 노출될 소개서 아이템이 없는 경우, 아래 기본 배너가 노출됩니다.
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {/* 홈 기본 배너 */}
                  <div style={{ flex: "1 1 200px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#718096" }}>🏠 홈</p>
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "#1a202c" }}>소개서에 신규 항목이 추가됐어요!</p>
                        <p style={{ margin: 0, fontSize: 10, color: "#718096", lineHeight: 1.4 }}>소개서를 80% 이상 채운 선생님의 성사가능성이 12배 더 높아요!</p>
                      </div>
                      <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📄</div>
                        <div style={{ position: "absolute", bottom: -2, right: -2, background: "#e53e3e", color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: 6, padding: "1px 4px", lineHeight: 1.4 }}>NEW</div>
                        <div style={{ position: "absolute", top: -4, right: -8, background: "#3182ce", color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: 5, padding: "1px 4px", lineHeight: 1.4 }}>4/12</div>
                      </div>
                    </div>
                  </div>
                  {/* 채팅 기본 배너 */}
                  <div style={{ flex: "1 1 200px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#718096" }}>💬 채팅</p>
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontSize: 10, color: "#718096" }}>성사가능성을 높이는 가장 쉬운 방법!</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a202c" }}>신규 소개서 항목 채우기</p>
                      </div>
                    </div>
                  </div>
                  {/* 학생찾기 기본 배너 */}
                  <div style={{ flex: "1 1 200px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#718096" }}>🔍 학생찾기</p>
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontSize: 10, color: "#718096" }}>성사가능성을 높이는 가장 쉬운 방법!</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a202c" }}>신규 소개서 항목 채우기</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p style={{ margin: "14px 0 0", fontSize: 12, color: "#718096" }}>🔔 노출 팝업 없음</p>
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
                        <p style={{ margin: "0 0 4px", fontSize: 11, color: "#a0aec0" }}>#{i + 1} <ItemName name={getField(q, "name")} /></p>
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
                        <p style={{ margin: 0, fontSize: 10, color: "#a0aec0" }}>#{i + 1} <ItemName name={getField(q, "name")} /></p>
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

        </CollapsibleStatusCard>
        ));
      })()}
    </div>
  );
}
