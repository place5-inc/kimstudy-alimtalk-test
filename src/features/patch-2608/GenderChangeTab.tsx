import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

const GENDER_META = {
  M: { label: "남성", color: "#2b6cb0", bg: "rgba(43,108,176,0.08)" },
  F: { label: "여성", color: "#b83280", bg: "rgba(184,50,128,0.08)" },
} as const;

type GenderKey = keyof typeof GENDER_META;

export function GenderChangeTab() {
  const [nickname, setNickname] = useState("");
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [currentGender, setCurrentGender] = useState<string | null | undefined>(undefined);
  const [originalGender, setOriginalGender] = useState<string | null>(null);

  const [targetGender, setTargetGender] = useState<GenderKey>("M");
  const [setting, setSetting] = useState(false);
  const [setResult, setSetResult] = useState<ResultState | null>(null);

  const { logout } = useAuth();
  const { env } = useEnv();
  const { show: showToast } = useToast();

  // ── 재조회 (내부 공유) ────────────────────────────────────────────────────
  const fetchGender = useCallback(async (nick: string) => {
    const r = await callProxy("/admin/test/get/user/gender", { nickname: nick }, { env });
    if (r.ok) {
      const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; gender?: string | null };
      if (json.isSuccess) {
        setCurrentGender(json.gender ?? null);
        return json.gender ?? null;
      }
    }
    return undefined;
  }, [env]);

  // ── STEP 1: 조회 ─────────────────────────────────────────────────────────
  const handleQuery = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) { setQueryError("닉네임을 입력해주세요."); return; }

    setQuerying(true);
    setQueryError(null);
    setCurrentGender(undefined);
    setOriginalGender(null);
    setSetResult(null);

    try {
      const r = await callProxy("/admin/test/get/user/gender", { nickname: nickname.trim() }, { env });
      if (r.ok) {
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; gender?: string | null };
        if (json.isSuccess) {
          const g = json.gender ?? null;
          setCurrentGender(g);
          setOriginalGender(g);
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
  }, [nickname, env, logout]);

  // ── STEP 2: 성별 변경 ─────────────────────────────────────────────────────
  const handleSet = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) { setSetResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

    setSetting(true);
    setSetResult(null);

    try {
      const r = await callProxy("/admin/test/set/user/gender", { nickname: nickname.trim(), gender: targetGender }, { env });
      if (r.ok) {
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (json.isSuccess) {
          showToast("완료되었습니다");
          setSetResult({ ok: true, message: json.systemMessage ?? "변경 완료!" });
          // 재조회
          setQuerying(true);
          try { await fetchGender(nickname.trim()); } finally { setQuerying(false); }
        } else {
          setSetResult({ ok: false, message: json.systemMessage ?? "변경 실패" });
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
  }, [nickname, targetGender, env, logout, showToast, fetchGender]);

  // ── 원상복구 ──────────────────────────────────────────────────────────────
  const handleRestore = useCallback(async () => {
    if (!originalGender || !nickname.trim()) return;
    const g = originalGender === "여성" ? "F" : "M";

    setSetting(true);
    setSetResult(null);
    try {
      const r = await callProxy("/admin/test/set/user/gender", { nickname: nickname.trim(), gender: g }, { env });
      if (r.ok) {
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (json.isSuccess) {
          showToast("원상복구 완료");
          setSetResult({ ok: true, message: `원상복구 완료: ${originalGender}으로 되돌렸습니다.` });
          setOriginalGender(null);
          setQuerying(true);
          try { await fetchGender(nickname.trim()); } finally { setQuerying(false); }
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
  }, [originalGender, nickname, env, logout, showToast, fetchGender]);

  const genderMeta = currentGender
    ? (GENDER_META[currentGender === "남성" ? "M" : "F"])
    : null;

  return (
    <div>
      <p className="page-title">성별 변경</p>
      <p className="page-subtitle">유저의 현재 성별을 조회하고 테스트 목적으로 임시 변경합니다.</p>

      {/* ── STEP 1 ──────────────────────────────────────────────────────────── */}
      <form className="section" onSubmit={(e) => void handleQuery(e)} noValidate>
        <p className="section-title">🔍 STEP 1 — 현재 성별 조회</p>
        <div className="field">
          <label htmlFor="gc_nickname">닉네임 <span className="required">*</span></label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="gc_nickname"
              type="text"
              placeholder="닉네임 입력"
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

      {/* ── 조회 결과 ────────────────────────────────────────────────────────── */}
      {currentGender !== undefined && (
        <div className="section">
          <p className="section-title">👤 현재 성별</p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "12px 20px",
            border: `2px solid ${genderMeta?.color ?? "#e2e8f0"}`,
            borderRadius: 10,
            background: genderMeta?.bg ?? "transparent",
          }}>
            <span style={{ fontSize: 28 }}>{currentGender === "남성" ? "♂️" : currentGender === "여성" ? "♀️" : "❓"}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: genderMeta?.color ?? "#718096" }}>
              {currentGender ?? "미설정"}
            </span>
          </div>

          {/* 원상복구 안내 */}
          {originalGender && currentGender !== originalGender && (
            <div style={{
              marginTop: 14, padding: "12px 16px",
              background: "rgba(255,200,0,0.12)", border: "1.5px solid #d69e2e",
              borderRadius: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#7b341e", flex: 1 }}>
                ⚠️ 테스트 완료 후에는 <strong>{originalGender}</strong>으로 원상복구해 주세요.
              </p>
              <button
                type="button"
                disabled={setting}
                onClick={() => void handleRestore()}
                style={{ background: "#d69e2e", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {setting ? "복구 중..." : `${originalGender}으로 복구`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2 ──────────────────────────────────────────────────────────── */}
      <form className="section" onSubmit={(e) => void handleSet(e)} noValidate>
        <p className="section-title">✏️ STEP 2 — 성별 변경</p>
        <div className="field">
          <label>변경할 성별 <span className="required">*</span></label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {(["M", "F"] as const).map((g) => (
              <label key={g} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px",
                border: `2px solid ${targetGender === g ? GENDER_META[g].color : "#e2e8f0"}`,
                borderRadius: 8, cursor: "pointer",
                background: targetGender === g ? GENDER_META[g].bg : "transparent",
                fontSize: 15, fontWeight: 600,
                color: targetGender === g ? GENDER_META[g].color : "#4a5568",
              }}>
                <input type="radio" name="gc_gender" value={g} checked={targetGender === g} onChange={() => setTargetGender(g)} />
                {g === "M" ? "♂️ 남성" : "♀️ 여성"}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-send" disabled={setting || !nickname.trim()}>
          {setting ? "변경 중..." : "성별 변경"}
        </button>

        <ResultBox result={setResult} />
      </form>
    </div>
  );
}
