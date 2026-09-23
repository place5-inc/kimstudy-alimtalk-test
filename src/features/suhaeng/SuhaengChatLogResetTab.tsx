import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function SuhaengChatLogResetTab() {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy]         = useState(false);
  const [result, setResult]     = useState<ResultState | null>(null);

  const { logout } = useAuth();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      try {
        const r = await callProxy("/admin/test/reset/kimsuhaeng/log", {
          nickname: nickname.trim(),
        });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          setResult({ ok: true, message: json.systemMessage || "로그 초기화 완료" });
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
    [nickname, logout],
  );

  return (
    <div>
      <p className="page-title">(채팅)김수행 로그 초기화</p>
      <p className="page-subtitle">해당 닉네임 회원의 kimsuhaeng 타입 발송 로그를 전부 삭제합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">로그 초기화</p>

        <div className="field">
          <label htmlFor="chlr_nickname">
            닉네임 <span className="required">*</span>
          </label>
          <input
            id="chlr_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-reset" disabled={busy}>
          {busy ? "처리 중..." : "로그 초기화"}
        </button>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
