import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function AbroadTutorTranslateTab() {
  const [translateNickname, setTranslateNickname] = useState("");
  const [translateBusy, setTranslateBusy]         = useState(false);
  const [translateResult, setTranslateResult]     = useState<ResultState | null>(null);

  const [resetNickname, setResetNickname] = useState("");
  const [resetBusy, setResetBusy]         = useState(false);
  const [resetResult, setResetResult]     = useState<ResultState | null>(null);

  const { logout } = useAuth();
  const { env }    = useEnv();

  const handleTranslate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!translateNickname.trim()) { setTranslateResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      setTranslateBusy(true);
      setTranslateResult(null);
      try {
        const r = await callProxy("/admin/test/abroad/translate/nickname", {
          nickname: translateNickname.trim(),
        }, { env });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          setTranslateResult({ ok: true, message: json.systemMessage ?? "번역이 진행중입니다." });
        } else {
          setTranslateResult({ ok: false, message: json.systemMessage ?? `실패 (${r.status})` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setTranslateResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setTranslateBusy(false);
      }
    },
    [translateNickname, env, logout],
  );

  const handleReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetNickname.trim()) { setResetResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      setResetBusy(true);
      setResetResult(null);
      try {
        const r = await callProxy("/admin/test/abroad/translate/reset", {
          nickname: resetNickname.trim(),
          includePre: "true",
        }, { env });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          setResetResult({ ok: true, message: json.systemMessage ?? "번역 초기화 완료" });
        } else {
          setResetResult({ ok: false, message: json.systemMessage ?? `실패 (${r.status})` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setResetResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setResetBusy(false);
      }
    },
    [resetNickname, env, logout],
  );

  return (
    <div>
      <p className="page-title">소개서 번역</p>
      <p className="page-subtitle">선생님의 소개서 정보를 다국어로 번역하거나 번역 데이터를 초기화합니다.</p>

      <form className="section" onSubmit={(e) => void handleTranslate(e)} noValidate>
        <p className="section-title">소개서 번역 실행</p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#718096" }}>
          번역은 백그라운드에서 진행되며 즉시 완료되지 않을 수 있습니다.
        </p>

        <div className="field">
          <label htmlFor="att_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="att_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={translateNickname}
            onChange={(e) => setTranslateNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={translateBusy}>
          {translateBusy ? "요청 중..." : "번역 실행"}
        </button>

        <ResultBox result={translateResult} />
      </form>

      <form className="section" onSubmit={(e) => void handleReset(e)} noValidate>
        <p className="section-title">소개서 번역 초기화</p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#718096" }}>
          해당 닉네임의 번역 데이터를 초기화합니다. <code>includePre=true</code>로 호출되며 사전 번역 데이터도 함께 삭제됩니다.
        </p>

        <div className="field">
          <label htmlFor="atr_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="atr_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={resetNickname}
            onChange={(e) => setResetNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-reset" disabled={resetBusy}>
          {resetBusy ? "처리 중..." : "번역 초기화"}
        </button>

        <ResultBox result={resetResult} />
      </form>
    </div>
  );
}
