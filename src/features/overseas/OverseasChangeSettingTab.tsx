import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

const LANG_OPTIONS = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "영어" },
  { value: "ja", label: "일본어" },
  { value: "zh", label: "중국어" },
  { value: "vi", label: "베트남어" },
] as const;

export function OverseasChangeSettingTab() {
  const [nickname, setNickname]   = useState("");
  const [type, setType]           = useState<"korean" | "foreign">("korean");
  const [languageCode, setLang]   = useState("en");
  const [busy, setBusy]           = useState(false);
  const [result, setResult]       = useState<ResultState | null>(null);

  const { logout } = useAuth();
  const { env }    = useEnv();

  const effectiveLang = type === "korean" ? "ko" : languageCode;

  const handleTypeChange = (t: "korean" | "foreign") => {
    setType(t);
    if (t === "foreign" && languageCode === "ko") setLang("en");
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      try {
        const r = await callProxy("/admin/test/abroad/change/setting", {
          nickname: nickname.trim(),
          type,
          languageCode: effectiveLang,
        }, { env });

        if (!r.body.trim()) { setResult({ ok: false, message: `빈 응답 (${r.status})` }); return; }
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          setResult({ ok: true, message: json.systemMessage ?? "변경 완료" });
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
    [nickname, type, effectiveLang, env, logout],
  );

  return (
    <div>
      <p className="page-title">한국인/외국인 변경</p>
      <p className="page-subtitle">사용자를 해외거주 한국인 또는 외국인으로 변경합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">설정 변경</p>

        {/* ── 닉네임 ───────────────────────────────────────────── */}
        <div className="field">
          <label htmlFor="cs_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="cs_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        {/* ── 유형 선택 ─────────────────────────────────────────── */}
        <div className="field">
          <label>유형 <span className="required">*</span></label>
          <div style={{ display: "flex", gap: 10 }}>
            {([
              { value: "korean", label: "해외거주 한국인", desc: "is_overseas_korean = true" },
              { value: "foreign", label: "외국인", desc: "is_foreigner = true" },
            ] as const).map(({ value, label, desc }) => {
              const selected = type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTypeChange(value)}
                  style={{
                    flex: 1, padding: "10px 14px", border: "2px solid",
                    borderColor: selected ? "#3182ce" : "#e2e8f0",
                    borderRadius: 8, background: selected ? "#ebf8ff" : "#fff",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: selected ? "#2b6cb0" : "#4a5568" }}>
                    {selected ? "✓ " : ""}{label}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#718096", fontFamily: "monospace" }}>{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 언어 코드 ─────────────────────────────────────────── */}
        <div className="field">
          <label>언어 설정 <span className="required">*</span></label>
          {type === "korean" ? (
            <div style={{
              padding: "10px 14px", background: "#f7fafc", border: "1px solid #e2e8f0",
              borderRadius: 8, color: "#718096", fontSize: 13,
            }}>
              🇰🇷 한국어 (ko) — 해외거주 한국인은 한국어 고정
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {LANG_OPTIONS.map(({ value, label }) => {
                const selected = languageCode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLang(value)}
                    style={{
                      padding: "7px 16px", border: "2px solid",
                      borderColor: selected ? "#3182ce" : "#e2e8f0",
                      borderRadius: 20, fontSize: 12, fontWeight: selected ? 700 : 400,
                      background: selected ? "#ebf8ff" : "#fff",
                      color: selected ? "#2b6cb0" : "#4a5568",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {selected ? "✓ " : ""}{label} ({value})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "처리 중..." : "변경"}
        </button>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
