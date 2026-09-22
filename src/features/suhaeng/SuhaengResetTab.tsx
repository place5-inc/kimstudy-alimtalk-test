import { useState, useCallback } from "react";
import { callProxyPost, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function SuhaengResetTab() {
  const [userId, setUserId] = useState("");
  const [busy, setBusy]     = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const { logout } = useAuth();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId.trim()) { setResult({ ok: false, message: "user_id를 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      try {
        const r = await callProxyPost("/api/test/users/reset", {
          user_id: userId.trim(),
        });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          setResult({ ok: true, message: json.systemMessage ?? "초기화 완료" });
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
    [userId, logout],
  );

  return (
    <div>
      <p className="page-title">회원 초기화</p>
      <p className="page-subtitle">회원을 김수행 신규 가입 전 상태로 초기화합니다. 실제 회원 탈퇴와 다릅니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">회원 초기화</p>

        <div className="field">
          <label htmlFor="sr_user_id">
            user_id (UUID) <span className="required">*</span>
          </label>
          <input
            id="sr_user_id"
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            autoComplete="off"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#718096" }}>
            호출할 때마다 실제 초기화가 실행됩니다. 파일이 있으면 cleanupAfter 이후 같은 user_id로 재호출해 파일을 정리하세요.
          </p>
        </div>

        <button type="submit" className="btn btn-reset" disabled={busy}>
          {busy ? "처리 중..." : "초기화 실행"}
        </button>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
