import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function AbroadNicknameConvertTab() {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy]         = useState(false);
  const [result, setResult]     = useState<ResultState | null>(null);
  const [converted, setConverted] = useState<string | null>(null);

  const { logout } = useAuth();
  const { env }    = useEnv();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      setConverted(null);
      try {
        const r = await callProxy("/admin/test/abroad/preivew/tutor/nickname", {
          nickname: nickname.trim(),
        }, { env });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; convertedNickname?: string };
        if (r.ok && json.isSuccess) {
          setConverted(json.convertedNickname ?? null);
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
      <p className="page-title">선생님 닉네임 변환</p>
      <p className="page-subtitle">외국인에게 보여질 닉네임을 미리보기로 보여드립니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">닉네임 미리보기</p>

        <div className="field">
          <label htmlFor="nc_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="nc_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "조회 중..." : "미리보기"}
        </button>

        {converted != null && (
          <div style={{
            marginTop: 16, padding: "16px 20px",
            background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: 10,
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            <span style={{ fontSize: 11, color: "#2b6cb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>변환된 닉네임</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#1a202c" }}>{converted}</span>
          </div>
        )}

        <ResultBox result={result} />
      </form>
    </div>
  );
}
