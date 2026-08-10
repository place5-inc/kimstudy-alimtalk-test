import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

interface MembershipInfo {
  membershipPoint: number | null;
  membershipLevel: number;
}

const LEVEL_LABELS: Record<number, string> = {
  0: "Lv.0 (없음)",
  1: "Lv.1",
  2: "Lv.2",
  3: "Lv.3",
  4: "Lv.4",
  5: "Lv.5",
  6: "Lv.6",
};

const LEVEL_MIN_POINTS: Record<number, number> = {
  1: 50_000,
  2: 100_000,
  3: 200_000,
  4: 500_000,
  5: 2_000_000,
  6: 10_000_000,
};

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

export function MembershipLevelTab() {
  // ── STEP 1: 조회 ────────────────────────────────────────────────────────────
  const [nickname, setNickname] = useState("");
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [info, setInfo] = useState<MembershipInfo | null>(null);
  // 원래 점수 캐시 (조회 시점에 저장)
  const [originalPoint, setOriginalPoint] = useState<number | null>(null);

  // ── STEP 2: 수정 ────────────────────────────────────────────────────────────
  const [setMode, setSetMode] = useState<"level" | "point">("level");
  const [targetLevel, setTargetLevel] = useState<string>("1");
  const [targetPoint, setTargetPoint] = useState<string>("");
  const [setting, setSetting] = useState(false);
  const [setResult, setSetResult] = useState<ResultState | null>(null);

  const { logout } = useAuth();
  const { env } = useEnv();
  const { show: showToast } = useToast();

  // ── 조회 ────────────────────────────────────────────────────────────────────
  const handleQuery = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setQueryError("닉네임을 입력해주세요."); return; }

      setQuerying(true);
      setQueryError(null);
      setInfo(null);
      setOriginalPoint(null);
      setSetResult(null);

      try {
        const r = await callProxy("/admin/test/get/membership/level", { nickname: nickname.trim() }, { env });
        if (r.ok) {
          const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null } & MembershipInfo;
          if (json.isSuccess) {
            setInfo({ membershipPoint: json.membershipPoint, membershipLevel: json.membershipLevel });
            setOriginalPoint(json.membershipPoint ?? null);
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
    },
    [nickname, env, logout],
  );

  // ── 수정 ────────────────────────────────────────────────────────────────────
  const handleSet = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setSetResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      const params: Record<string, string> = { nickname: nickname.trim() };
      if (setMode === "level") {
        const lv = parseInt(targetLevel, 10);
        if (isNaN(lv) || lv < 1 || lv > 6) { setSetResult({ ok: false, message: "레벨은 1~6 사이여야 합니다." }); return; }
        params.level = String(lv);
      } else {
        const pt = parseInt(targetPoint, 10);
        if (isNaN(pt) || pt < 0) { setSetResult({ ok: false, message: "올바른 점수를 입력해주세요." }); return; }
        params.membershipPoint = String(pt);
      }

      setSetting(true);
      setSetResult(null);

      try {
        const r = await callProxy("/admin/test/set/membership/level", params, { env });
        if (r.ok) {
          const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
          if (json.isSuccess) {
            showToast("완료되었습니다");
            setSetResult({ ok: true, message: "수정 완료!" });
            // 수정 후 자동 재조회
            setQuerying(true);
            setInfo(null);
            try {
              const r2 = await callProxy("/admin/test/get/membership/level", { nickname: nickname.trim() }, { env });
              if (r2.ok) {
                const j2 = JSON.parse(r2.body) as { isSuccess: boolean } & MembershipInfo;
                if (j2.isSuccess) setInfo({ membershipPoint: j2.membershipPoint, membershipLevel: j2.membershipLevel });
              }
            } finally {
              setQuerying(false);
            }
          } else {
            setSetResult({ ok: false, message: json.systemMessage ?? "수정 실패" });
          }
        } else {
          setSetResult({ ok: false, message: `실패 (${r.status}) ${r.body}` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setSetResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setSetting(false);
      }
    },
    [nickname, setMode, targetLevel, targetPoint, env, logout, showToast],
  );

  // ── 원상복구 ────────────────────────────────────────────────────────────────
  const handleRestore = useCallback(
    async () => {
      if (originalPoint === null || !nickname.trim()) return;
      setSetting(true);
      setSetResult(null);
      try {
        const r = await callProxy(
          "/admin/test/set/membership/level",
          { nickname: nickname.trim(), membershipPoint: String(originalPoint) },
          { env },
        );
        if (r.ok) {
          const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
          if (json.isSuccess) {
            showToast("원상복구 완료");
            setSetResult({ ok: true, message: `원상복구 완료: ${fmt(originalPoint)}점으로 되돌렸습니다.` });
            setOriginalPoint(null);
            setInfo(null);
          } else {
            setSetResult({ ok: false, message: json.systemMessage ?? "원상복구 실패" });
          }
        } else {
          setSetResult({ ok: false, message: `실패 (${r.status}) ${r.body}` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setSetResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setSetting(false);
      }
    },
    [originalPoint, nickname, env, logout, showToast],
  );

  const levelColor = (lv: number) => {
    if (lv >= 5) return "#6b21a8";
    if (lv >= 3) return "#1d4ed8";
    if (lv >= 1) return "#15803d";
    return "#718096";
  };

  return (
    <div>
      <p className="page-title">멤버십 레벨 확인 및 수정</p>
      <p className="page-subtitle">
        튜터 계정의 멤버십 점수·레벨을 조회하고 테스트 목적으로 임시 변경합니다.
        <br />
        테스트 완료 후에는 반드시 원래 점수로 복구해 주세요.
      </p>

      {/* ── STEP 1: 닉네임 조회 ───────────────────────────────────────────── */}
      <form className="section" onSubmit={(e) => void handleQuery(e)} noValidate>
        <p className="section-title">🔍 STEP 1 — 멤버십 현황 조회</p>
        <div className="field">
          <label htmlFor="ml_nickname">
            닉네임 <span className="required">*</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="ml_nickname"
              type="text"
              placeholder="튜터 닉네임 입력"
              autoComplete="off"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-send" disabled={querying} style={{ width: "auto", padding: "0 20px" }}>
              {querying ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>
        {queryError && <div className="result-box result-error" role="status">{queryError}</div>}
      </form>

      {/* ── 조회 결과 ─────────────────────────────────────────────────────── */}
      {info && (
        <div className="section">
          <p className="section-title">📊 현재 멤버십 현황</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{
              flex: 1, minWidth: 140, padding: "14px 18px",
              border: `2px solid ${levelColor(info.membershipLevel)}`,
              borderRadius: 10, textAlign: "center",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "#718096" }}>멤버십 레벨</p>
              <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, color: levelColor(info.membershipLevel) }}>
                {LEVEL_LABELS[info.membershipLevel] ?? `Lv.${info.membershipLevel}`}
              </p>
            </div>
            <div style={{
              flex: 1, minWidth: 140, padding: "14px 18px",
              border: "2px solid #e2e8f0", borderRadius: 10, textAlign: "center",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "#718096" }}>멤버십 포인트</p>
              <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700, color: "#1a202c", fontFamily: "monospace" }}>
                {info.membershipPoint !== null ? fmt(info.membershipPoint) : "-"}
              </p>
            </div>
          </div>

          {/* 원상복구 안내 */}
          {originalPoint !== null && (
            <div style={{
              marginTop: 14, padding: "12px 16px",
              background: "rgba(255,200,0,0.12)", border: "1.5px solid #d69e2e",
              borderRadius: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#7b341e", flex: 1 }}>
                ⚠️ 테스트 완료 후에는 <strong>{fmt(originalPoint)}점</strong>으로 원상복구해 주세요.
              </p>
              <button
                type="button"
                className="btn"
                disabled={setting}
                onClick={() => void handleRestore()}
                style={{ background: "#d69e2e", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {setting ? "복구 중..." : `${fmt(originalPoint)}점으로 복구`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: 수정 ──────────────────────────────────────────────────── */}
      <form className="section" onSubmit={(e) => void handleSet(e)} noValidate>
        <p className="section-title">✏️ STEP 2 — 멤버십 수정</p>

        <div className="field">
          <label>수정 방식 <span className="required">*</span></label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {([
              { value: "level", label: "레벨로 설정 (최솟값 포인트로 자동 변환)", desc: `1~6 중 선택` },
              { value: "point", label: "포인트 직접 입력", desc: "정확한 점수 지정" },
            ] as const).map((opt) => (
              <label key={opt.value} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
                border: `2px solid ${setMode === opt.value ? "#3182ce" : "#e2e8f0"}`,
                borderRadius: 8, cursor: "pointer",
                background: setMode === opt.value ? "rgba(49,130,206,0.05)" : "transparent",
                fontSize: 13,
              }}>
                <input type="radio" name="ml_set_mode" value={opt.value} checked={setMode === opt.value} onChange={() => setSetMode(opt.value)} />
                <span><strong>{opt.label}</strong><span style={{ marginLeft: 8, fontSize: 12, color: "#718096" }}>{opt.desc}</span></span>
              </label>
            ))}
          </div>
        </div>

        {setMode === "level" ? (
          <div className="field">
            <label htmlFor="ml_level">
              멤버십 레벨 <span className="required">*</span>
            </label>
            <select
              id="ml_level"
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              style={{ maxWidth: 200 }}
            >
              {[1, 2, 3, 4, 5, 6].map((lv) => (
                <option key={lv} value={String(lv)}>
                  Lv.{lv} (최소 {fmt(LEVEL_MIN_POINTS[lv])}점)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="ml_point">
              멤버십 포인트 <span className="required">*</span>
            </label>
            <input
              id="ml_point"
              type="number"
              min={0}
              placeholder="예: 150000"
              value={targetPoint}
              onChange={(e) => setTargetPoint(e.target.value)}
              style={{ maxWidth: 200 }}
            />
          </div>
        )}

        <button type="submit" className="btn btn-send" disabled={setting || !nickname.trim()}>
          {setting ? "수정 중..." : "멤버십 수정"}
        </button>

        <ResultBox result={setResult} />
      </form>
    </div>
  );
}
