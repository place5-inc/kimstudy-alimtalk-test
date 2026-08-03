import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function PassPredictorCouponTab() {
  const [nickname, setNickname] = useState("");
  const [addTen, setAddTen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const { logout } = useAuth();
  const { env } = useEnv();
  const { show: showToast } = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) {
        setResult({ ok: false, message: "닉네임을 입력해주세요." });
        return;
      }

      setBusy(true);
      setResult(null);

      try {
        const r = await callProxy(
          "/admin/pass-predictor/add/coupon",
          { nickname: nickname.trim(), addTen: String(addTen) },
          { env },
        );
        if (r.ok) {
          setResult({ ok: true, message: `성공 (${r.status}) ${r.body}` });
          setNickname("");
          setAddTen(false);
        } else {
          setResult({ ok: false, message: `실패 (${r.status}) ${r.body}` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) {
          await logout();
          return;
        }
        setResult({
          ok: false,
          message: `오류: ${e instanceof Error ? e.message : String(e)}`,
        });
      } finally {
        setBusy(false);
        showToast("완료되었습니다");
      }
    },
    [nickname, addTen, env, logout, showToast],
  );

  return (
    <div>
      <p className="page-title">합격예측기 쿠폰 추가</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">🎟️ 합격예측기 쿠폰 추가</p>

        <div className="field">
          <label htmlFor="coupon_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="coupon_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <div className="field">
          <label
            htmlFor="coupon_add_ten"
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <input
              id="coupon_add_ten"
              type="checkbox"
              checked={addTen}
              onChange={(e) => setAddTen(e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <span>10개 추가</span>
          </label>
          <p className="hint">체크 시 쿠폰 10개를 추가합니다. 기본은 1개 추가입니다.</p>
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "처리 중..." : "쿠폰(초대) 추가"}
        </button>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
