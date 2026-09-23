import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function SuhaengPaymentAddTab() {
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
        const r = await callProxy("/admin/test/add/kimsuhaeng/payment/log", {
          nickname: nickname.trim(),
        });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          setResult({ ok: true, message: json.systemMessage || "결제이력 추가 완료" });
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
      <p className="page-title">(결제)김수행 결제이력 추가</p>
      <p className="page-subtitle">
        닉네임에 해당하는 유저의 <code>kimsuhaeng_payment_log</code>에 테스트 결제 완료 건을 1건 추가합니다.
        <br />
        <code>payment_order_id</code>는 <code>"test" + UUID(32자)</code> 형식으로 생성됩니다.
      </p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">결제이력 추가</p>

        <div className="field">
          <label htmlFor="spa_nickname">
            닉네임 <span className="required">*</span>
          </label>
          <input
            id="spa_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "처리 중..." : "결제이력 추가"}
        </button>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
