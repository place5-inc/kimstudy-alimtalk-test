import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function SuhaengChatLogDateTab() {
  const [nickname, setNickname] = useState("");
  const [date, setDate]         = useState("");
  const [busy, setBusy]         = useState(false);
  const [result, setResult]     = useState<ResultState | null>(null);

  const { logout } = useAuth();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }
      if (!date.trim())     { setResult({ ok: false, message: "날짜를 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      try {
        const r = await callProxy("/admin/test/change/date/kimsuhaeng/log", {
          nickname: nickname.trim(),
          date: date.trim(),
        });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          setResult({ ok: true, message: json.systemMessage || "날짜 변경 완료" });
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
    [nickname, date, logout],
  );

  return (
    <div>
      <p className="page-title">(채팅)김수행 로그 날짜 변경</p>
      <p className="page-subtitle">기존 로그를 삭제하고 입력한 날짜로 1건 재생성합니다. 시분초는 현재 시각이 적용됩니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">날짜 변경</p>

        <div className="field">
          <label htmlFor="chld_nickname">
            닉네임 <span className="required">*</span>
          </label>
          <input
            id="chld_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="chld_date">
            날짜 <span className="required">*</span>
          </label>
          <input
            id="chld_date"
            type="text"
            placeholder="yyyy-MM-dd / yyyyMMdd / yyyy.MM.dd"
            autoComplete="off"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "처리 중..." : "날짜 변경"}
        </button>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
