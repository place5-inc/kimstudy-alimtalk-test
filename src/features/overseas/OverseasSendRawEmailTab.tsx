import { useState, useCallback } from "react";
import { callProxyPost, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function OverseasSendRawEmailTab() {
  const [toEmail, setToEmail] = useState("");
  const [title, setTitle]     = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [busy, setBusy]       = useState(false);
  const [result, setResult]   = useState<ResultState | null>(null);

  const { logout }           = useAuth();
  const { env }              = useEnv();
  const { show: showToast }  = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!toEmail.trim())  { setResult({ ok: false, message: "이메일을 입력해주세요." }); return; }
      if (!htmlBody.trim()) { setResult({ ok: false, message: "HTML 바디를 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      try {
        const params = new URLSearchParams({ toEmail: toEmail.trim() });
        if (title.trim()) params.set("title", title.trim());

        const r = await callProxyPost(
          `/admin/test/abroad/send/raw/email?${params.toString()}`,
          {},
          { env, rawBody: htmlBody.trim() },
        );

        if (!r.body.trim()) { setResult({ ok: false, message: `빈 응답 (${r.status})` }); return; }
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          showToast("발송 완료");
          setResult({ ok: true, message: json.systemMessage ?? "발송 완료" });
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
    [toEmail, title, htmlBody, env, logout, showToast],
  );

  return (
    <div>
      <p className="page-title">이메일 발송 (raw)</p>
      <p className="page-subtitle">HTML 원문을 직접 입력해 테스트 이메일을 발송합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">발송 정보 입력</p>

        <div className="field">
          <label htmlFor="rse_toEmail">
            수신 이메일 <span className="required">*</span>
          </label>
          <input
            id="rse_toEmail"
            type="email"
            placeholder="abcd@place5.com"
            autoComplete="off"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="rse_title">
            제목 <span style={{ fontSize: 11, color: "#a0aec0" }}>(선택)</span>
          </label>
          <input
            id="rse_title"
            type="text"
            placeholder="기본값: [TEST] 김스터디 이메일 테스트"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="rse_htmlBody">
            HTML 바디 <span className="required">*</span>
          </label>
          <textarea
            id="rse_htmlBody"
            placeholder={"<html>\n  <body>\n    <h1>테스트</h1>\n  </body>\n</html>"}
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              minHeight: 240, fontFamily: "monospace", fontSize: 12,
              padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6,
              resize: "vertical", lineHeight: 1.6,
            }}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "발송 중..." : "📧 발송"}
        </button>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
