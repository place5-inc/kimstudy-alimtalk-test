import { useState, useCallback, useRef } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function AccessTokenTab() {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { logout } = useAuth();
  const { env } = useEnv();

  const handleCopy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      setToken(null);
      try {
        const r = await callProxy("/admin/test/getAccessToken", {
          nickname: nickname.trim(),
        }, { env });

        if (!r.body.trim()) { setResult({ ok: false, message: `빈 응답 (${r.status})` }); return; }
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; token?: string };
        if (r.ok && json.isSuccess) {
          setToken(json.token ?? null);
          setResult({ ok: true, message: json.systemMessage ?? "조회 성공" });
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
      <p className="page-title">액세스토큰 조회</p>
      <p className="page-subtitle">닉네임으로 액세스토큰을 조회합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">액세스토큰 조회</p>

        <div className="field">
          <label htmlFor="at_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="at_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "조회 중..." : "조회"}
        </button>

        {token != null && (
          <div style={{
            marginTop: 16, padding: "16px 20px",
            background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: 10,
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#2b6cb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>액세스토큰</span>
              <button
                type="button"
                onClick={() => handleCopy(token)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: "4px 12px",
                  borderRadius: 6, border: "1px solid",
                  cursor: "pointer", transition: "all 0.15s",
                  background: copied ? "#c6f6d5" : "#bee3f8",
                  borderColor: copied ? "#68d391" : "#63b3ed",
                  color: copied ? "#276749" : "#2b6cb0",
                }}
              >
                {copied ? "복사됨 ✓" : "복사"}
              </button>
            </div>
            <textarea
              readOnly
              value={token}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              style={{
                width: "100%", boxSizing: "border-box",
                fontSize: 12, fontFamily: "monospace", color: "#1a202c",
                background: "#fff", border: "1px solid #bee3f8", borderRadius: 6,
                padding: "8px 10px", resize: "none",
                lineHeight: 1.6, wordBreak: "break-all",
                minHeight: 80, cursor: "text",
              }}
            />
          </div>
        )}

        <ResultBox result={result} />
      </form>
    </div>
  );
}
