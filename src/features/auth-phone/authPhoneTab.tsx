import { useState, useCallback } from "react";
import { z } from "zod";
import { requiredText } from "../../shared/ui/ActionForm";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

const schema = z.object({ phoneNumber: requiredText });

interface AuthPhoneResponse {
  isSuccess: boolean;
  systemMessage: string | null;
  code?: string;
}

export function AuthPhoneTab() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const { logout } = useAuth();
  const { show: showToast } = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const parsed = schema.safeParse({ phoneNumber });
      if (!parsed.success) {
        setResult({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." });
        return;
      }

      setBusy(true);
      setResult(null);
      setAuthCode(null);

      try {
        const r = await callProxy("/api/admin/test/auth/phone", { phoneNumber });
        if (r.ok) {
          try {
            const data = JSON.parse(r.body) as AuthPhoneResponse;
            if (data.isSuccess && data.code) {
              setAuthCode(data.code);
              setResult({ ok: true, message: "인증번호 조회 성공" });
            } else {
              setResult({
                ok: false,
                message: data.systemMessage ?? "인증번호 조회 실패",
              });
            }
          } catch {
            setResult({ ok: true, message: r.body });
          }
        } else {
          try {
            const data = JSON.parse(r.body) as AuthPhoneResponse;
            setResult({
              ok: false,
              message: data.systemMessage ?? `실패 (${r.status})`,
            });
          } catch {
            setResult({ ok: false, message: `실패 (${r.status}) ${r.body}` });
          }
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
        showToast("처리가 완료되었습니다");
      }
    },
    [phoneNumber, logout, showToast],
  );

  return (
    <div>
      <p className="page-title">휴대폰 - 인증번호 (4자리) 확인</p>
      <p className="page-subtitle">
        로그인, 회원가입을 위한 인증번호 4자리를 확인할 수 있어요.
      </p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">인증번호 확인</p>

        <div className="field">
          <label htmlFor="ap_phone">
            phoneNumber <span className="required">*</span>
          </label>
          <input
            id="ap_phone"
            type="text"
            placeholder="휴대폰 번호 입력 (예: 01012345678)"
            autoComplete="off"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "처리 중..." : "확인"}
        </button>

        {authCode && (
          <div
            style={{
              margin: "16px 0",
              padding: "16px 20px",
              background: "#f0f9ff",
              border: "2px solid #0ea5e9",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "13px", color: "#0369a1", marginBottom: "6px" }}>
              인증번호
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "36px",
                fontWeight: 700,
                letterSpacing: "0.3em",
                color: "#0c4a6e",
                fontFamily: "monospace",
              }}
            >
              {authCode}
            </p>
          </div>
        )}

        <ResultBox result={result} />
      </form>
    </div>
  );
}
