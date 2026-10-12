import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function AccessTokenTab() {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const { logout } = useAuth();
  const { env } = useEnv();

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
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; accessToken?: string };
        if (r.ok && json.isSuccess) {
          setToken(json.accessToken ?? null);
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
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            <span style={{ fontSize: 11, color: "#2b6cb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>액세스토큰</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a202c", wordBreak: "break-all", fontFamily: "monospace" }}>{token}</span>
          </div>
        )}

        <ResultBox result={result} />
      </form>
    </div>
  );
}
