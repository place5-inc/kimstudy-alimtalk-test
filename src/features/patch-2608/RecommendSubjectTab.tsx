import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

// ── 응답 타입 ─────────────────────────────────────────────────────────────────
interface SubjectItem {
  subjectId: string;
  subjectName: string;
  groupKey: number | null;
  groupName: string | null;
}

interface MatchingItem {
  matchingKey: string;
  subjects: SubjectItem[];
}

interface GroupKeyItem {
  groupKey: number;
  groupName: string | null;
}

interface StatRow {
  subjectId: string;
  subjectName: string;
  groupKey: number;
  groupName: string | null;
  pickCnt: number;
  isExcluded: boolean;
}

interface DebugData {
  userId: string;
  stateId: number | null;
  lessonGradeId: number | null;
  currentSubjects: SubjectItem[];
  excludeGroupKeys: GroupKeyItem[];
  myMatchings: MatchingItem[];
  myMatchingGroupKeys: GroupKeyItem[];
  statRows: StatRow[];
}

// ── 작은 UI 헬퍼 ─────────────────────────────────────────────────────────────
function Tag({
  children,
  color = "#4a5568",
  bg = "#edf2f7",
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        fontWeight: 600,
        color,
        background: bg,
        borderRadius: 4,
        padding: "2px 7px",
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      {children}
    </span>
  );
}

function SectionBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 16,
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#f7fafc",
          padding: "8px 14px",
          borderBottom: "1px solid #e2e8f0",
          fontSize: 13,
          fontWeight: 700,
          color: "#2d3748",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export function RecommendSubjectTab() {
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ResultState | null>(null);
  const [data, setData] = useState<DebugData | null>(null);

  const { logout } = useAuth();
  const { env } = useEnv();

  const handleQuery = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!requestId.trim()) {
        setError({ ok: false, message: "requestId를 입력해주세요." });
        return;
      }

      setLoading(true);
      setError(null);
      setData(null);

      try {
        const r = await callProxy(
          "/admin/test/get/recommend/subjects",
          { requestId: requestId.trim() },
          { env },
        );
        if (r.ok) {
          const json = JSON.parse(r.body) as {
            isSuccess: boolean;
            systemMessage: string | null;
            debug?: DebugData;
          };
          if (json.isSuccess && json.debug) {
            setData(json.debug);
          } else {
            setError({ ok: false, message: json.systemMessage ?? "조회 실패" });
          }
        } else {
          setError({ ok: false, message: `실패 (${r.status}) ${r.body}` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) {
          await logout();
          return;
        }
        setError({
          ok: false,
          message: `오류: ${e instanceof Error ? e.message : String(e)}`,
        });
      } finally {
        setLoading(false);
      }
    },
    [requestId, env, logout],
  );

  // 최종 추천 상위 5개: isExcluded=false, pickCnt 내림차순
  const top5 = data
    ? [...data.statRows]
        .filter((s) => !s.isExcluded)
        .sort((a, b) => b.pickCnt - a.pickCnt)
        .slice(0, 5)
    : [];

  return (
    <div>
      <p className="page-title">자녀 교차 판매 - 추천 과목 확인</p>
      <p className="page-subtitle">
        모집공고 ID를 입력하면 교차 판매 중간 확인 용 추천 과목을 확인할 수
        있습니다.
      </p>

      {/* 입력 */}
      <form
        className="section"
        onSubmit={(e) => void handleQuery(e)}
        noValidate
      >
        <p className="section-title">🔍 모집공고 조회</p>
        <div className="field">
          <label htmlFor="rs_requestId">
            requestId (GUID) <span className="required">*</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="rs_requestId"
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              style={{ flex: 1, fontFamily: "monospace", fontSize: 13 }}
            />
            <button
              type="submit"
              className="btn btn-send"
              disabled={loading}
              style={{ width: "auto", padding: "0 20px" }}
            >
              {loading ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>
        <ResultBox result={error} />
      </form>

      {data && (
        <div className="section">
          {/* ── ① 최종 추천 TOP 5 ─────────────────────────────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-title" style={{ marginBottom: 10 }}>
              ⭐ 최종 추천 과목 TOP 5
            </p>
            {top5.length === 0 ? (
              <p style={{ fontSize: 13, color: "#718096" }}>
                추천 가능한 과목이 없습니다.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {top5.map((s, i) => (
                  <div
                    key={s.subjectId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 16px",
                      background: "#f7fafc",
                      border: "2px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "#e2e8f0",
                        color: "#4a5568",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#1a202c",
                        }}
                      >
                        {s.subjectName}
                      </span>
                      {s.groupName && (
                        <Tag color="#2b6cb0" bg="rgba(43,108,176,0.1)">
                          {s.groupName}
                        </Tag>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#718096",
                        fontFamily: "monospace",
                      }}
                    >
                      pick {s.pickCnt.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── ② 현재 공고 과목 ──────────────────────────────────────────── */}
          <SectionBox
            title={`📋 현재 공고 과목 (${data.currentSubjects.length}개)`}
          >
            {data.currentSubjects.length === 0 ? (
              <p style={{ fontSize: 13, color: "#718096" }}>과목 없음</p>
            ) : (
              data.currentSubjects.map((s) => (
                <div key={s.subjectId} style={{ marginBottom: 4 }}>
                  <Tag color="#276749" bg="rgba(39,103,73,0.08)">
                    {s.subjectName}
                  </Tag>
                  {s.groupName && (
                    <Tag color="#718096">
                      {s.groupName} (그룹 {s.groupKey})
                    </Tag>
                  )}
                </div>
              ))
            )}
          </SectionBox>

          {/* ── ③ 제외 예정 그룹 ──────────────────────────────────────────── */}
          <SectionBox
            title={`🚫 제외 예정 그룹 (${data.excludeGroupKeys.length}개)`}
          >
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#718096" }}>
              현재 공고 과목 계열 + 3개월 내 성사 수업 과목 계열 + group_key
              3(기타)
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {data.excludeGroupKeys.map((g) => (
                <Tag key={g.groupKey} color="#c53030" bg="rgba(197,48,48,0.08)">
                  {g.groupName ?? "?그룹"} ({g.groupKey})
                </Tag>
              ))}
            </div>
          </SectionBox>

          {/* ── ④ 3개월 내 성사 매칭 ─────────────────────────────────────── */}
          <SectionBox
            title={`🤝 3개월 내 성사 매칭 (${data.myMatchings.length}건)`}
          >
            {data.myMatchings.length === 0 ? (
              <p style={{ fontSize: 13, color: "#718096" }}>성사된 매칭 없음</p>
            ) : (
              data.myMatchings.map((m) => (
                <div
                  key={m.matchingKey}
                  style={{
                    marginBottom: 10,
                    paddingBottom: 10,
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 11,
                      color: "#a0aec0",
                      fontFamily: "monospace",
                    }}
                  >
                    {m.matchingKey}
                  </p>
                  <div>
                    {m.subjects.map((s) => (
                      <span key={s.subjectId}>
                        <Tag color="#276749" bg="rgba(39,103,73,0.08)">
                          {s.subjectName}
                        </Tag>
                        {s.groupName && (
                          <Tag color="#718096">{s.groupName}</Tag>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
            {data.myMatchingGroupKeys.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#4a5568",
                  }}
                >
                  → 이 매칭들로 인해 추가 제외된 그룹
                </p>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {data.myMatchingGroupKeys.map((g) => (
                    <Tag
                      key={g.groupKey}
                      color="#c53030"
                      bg="rgba(197,48,48,0.08)"
                    >
                      {g.groupName ?? "?그룹"} ({g.groupKey})
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </SectionBox>

          {/* ── ⑤ 전체 stat 목록 (상위 20개) ─────────────────────────────── */}
          <SectionBox
            title={`📊 지역·학년 기준 인기 과목 상위 ${data.statRows.length}개`}
          >
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#718096" }}>
              <span style={{ color: "#c53030", fontWeight: 600 }}>취소선</span>:
              제외 그룹 /
              <span style={{ color: "#3182ce", fontWeight: 600 }}> 파란색</span>
              : 추천 후보
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.statRows.map((s, i) => (
                <div
                  key={s.subjectId}
                  style={{
                    padding: "6px 10px",
                    border: `1.5px solid ${s.isExcluded ? "#e2e8f0" : "#3182ce"}`,
                    borderRadius: 6,
                    background: s.isExcluded
                      ? "transparent"
                      : "rgba(49,130,206,0.05)",
                    opacity: s.isExcluded ? 0.45 : 1,
                    textDecoration: s.isExcluded ? "line-through" : "none",
                    minWidth: 80,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      color: s.isExcluded ? "#718096" : "#1a202c",
                    }}
                  >
                    {i + 1}. {s.subjectName}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      color: "#a0aec0",
                    }}
                  >
                    {s.groupName ?? "-"} · {s.pickCnt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      )}
    </div>
  );
}
