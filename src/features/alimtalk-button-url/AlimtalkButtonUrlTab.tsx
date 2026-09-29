import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";

interface ButtonUrlResult {
  message: string;
  button_url: string;
}

const BIZZPURIO_ACCOUNT = "richard555";
const BIZGO_SENDER_KEY  = "1002c3c4c19514277d0cf361aedb50129bd05d59";

interface ParsedAlimtalk {
  type: "bizzpurio" | "bizgo" | "unknown";
  templateCode?: string;
  text?: string;
  buttons: { name?: string; urlPc?: string }[];
}

function parseSendType(raw: string): ParsedAlimtalk {
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;

    // 비즈뿌리오: account === "richard555", 구조는 content.at 안에 중첩
    if (p["account"] === BIZZPURIO_ACCOUNT) {
      const at = (p["content"] as Record<string, unknown>)?.["at"] as Record<string, unknown> | undefined;
      const btns = (at?.["button"] as { name?: string; url_pc?: string }[] | undefined) ?? [];
      return {
        type: "bizzpurio",
        templateCode: at?.["templatecode"] as string | undefined,
        text: at?.["message"] as string | undefined,
        buttons: btns.map((b) => ({ name: b.name, urlPc: b.url_pc })),
      };
    }

    // 비즈고: senderKey 매칭, 구조는 최상위
    if (p["senderKey"] === BIZGO_SENDER_KEY) {
      const btns = (p["buttons"] as { name?: string; urlPc?: string }[] | undefined) ?? [];
      return {
        type: "bizgo",
        templateCode: p["templateCode"] as string | undefined,
        text: p["text"] as string | undefined,
        buttons: btns.map((b) => ({ name: b.name, urlPc: b.urlPc })),
      };
    }

    return { type: "unknown", buttons: [] };
  } catch {
    return { type: "unknown", buttons: [] };
  }
}

function SendTypeBadge({ type }: { type: "bizzpurio" | "bizgo" | "unknown" }) {
  const map = {
    bizzpurio: { label: "비즈뿌리오 발송", bg: "#ebf8ff", border: "#90cdf4", color: "#2b6cb0" },
    bizgo:     { label: "비즈고 발송",     bg: "#f0fff4", border: "#9ae6b4", color: "#276749" },
    unknown:   { label: "알 수 없음",      bg: "#edf2f7", border: "#cbd5e0", color: "#718096" },
  };
  const s = map[type];
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        flexShrink: 0, padding: "7px 14px", borderRadius: 6, border: "none",
        background: copied ? "#38a169" : "#3182ce", color: "#fff",
        fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
        transition: "background 0.2s",
      }}
    >
      {copied ? "복사됨 ✓" : "복사"}
    </button>
  );
}

function UrlRow({ label, url }: { label?: string; url: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <p style={{ fontSize: 11, color: "#718096", margin: "0 0 4px" }}>{label}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <code style={{
          flex: 1, fontSize: 12, background: "#edf2f7", padding: "7px 10px",
          borderRadius: 6, wordBreak: "break-all", color: "#2b6cb0", lineHeight: 1.6,
        }}>
          {url}
        </code>
        <CopyButton text={url} />
      </div>
    </div>
  );
}

export function AlimtalkButtonUrlTab() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [results, setResults]         = useState<ButtonUrlResult[] | null>(null);

  const { logout } = useAuth();
  const { env }    = useEnv();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!phoneNumber.trim()) { setError("휴대폰 번호를 입력해주세요."); return; }

      setBusy(true);
      setError(null);
      setResults(null);

      try {
        const r = await callProxy(
          "/admin/test/get/button/url",
          { phoneNumber: phoneNumber.trim().replace(/-/g, "") },
          { env },
        );

        if (r.ok) {
          try {
            const json = JSON.parse(r.body) as { isSuccess?: boolean; result?: ButtonUrlResult[] };
            setResults(json.result && json.result.length > 0 ? json.result : []);
          } catch {
            setError(`응답 파싱 실패: ${r.body}`);
          }
        } else {
          setError(`실패 (${r.status}) ${r.body}`);
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setError(`오류: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [phoneNumber, env, logout],
  );

  return (
    <div>
      <p className="page-title">알림톡 버튼 URL 확인</p>
      <p className="page-subtitle">최근 발송 성공한 알림톡 최대 5건의 버튼 URL을 조회합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">버튼 URL 조회</p>
        <div className="field">
          <label htmlFor="alimtalk_phone">
            휴대폰 번호 <span className="required">*</span>
          </label>
          <input
            id="alimtalk_phone"
            type="text"
            placeholder="휴대폰 번호 입력 (예: 01012345678, 010-1234-5678)"
            autoComplete="off"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "조회 중..." : "조회하기"}
        </button>
      </form>

      {error && (
        <div className="result-box result-error" role="status" aria-live="polite">{error}</div>
      )}
      {results !== null && results.length === 0 && (
        <div className="result-box result-error" role="status" aria-live="polite">조회된 알림톡 로그가 없습니다.</div>
      )}

      {results && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {results.map((item, index) => {
            const parsed = parseSendType(item.message);

            return (
              <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                {/* 헤더 */}
                <div style={{
                  background: "#f7fafc", borderBottom: "1px solid #e2e8f0",
                  padding: "8px 14px", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 12, color: "#718096", fontWeight: 600 }}>
                    #{index + 1} — 최근 발송 알림톡
                  </span>
                  <SendTypeBadge type={parsed.type} />
                  {parsed.templateCode && (
                    <span style={{ fontSize: 11, color: "#a0aec0", fontFamily: "monospace" }}>
                      {parsed.templateCode}
                    </span>
                  )}
                </div>

                {/* 메시지 미리보기 */}
                <div style={{ padding: "12px 14px 0" }}>
                  <p style={{ fontSize: 12, color: "#718096", marginBottom: 4 }}>알림톡 내용</p>
                  <pre style={{
                    fontSize: 12, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap",
                    wordBreak: "break-all", background: "#f7fafc",
                    border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 12px",
                    maxHeight: 120, overflowY: "auto", color: "#2d3748",
                  }}>
                    {parsed.text ?? item.message}
                  </pre>
                </div>

                {/* 버튼 URL */}
                <div style={{ padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, color: "#718096", marginBottom: 6 }}>버튼 URL</p>

                  {parsed.buttons.length > 0 ? (
                    parsed.buttons.map((btn, bi) => (
                      <UrlRow
                        key={bi}
                        label={btn.name ? `${btn.name}${parsed.type === "bizgo" ? " (urlPc)" : ""}` : `버튼 ${bi + 1}`}
                        url={btn.urlPc ?? "—"}
                      />
                    ))
                  ) : (
                    // 파싱 실패 fallback: 기존 button_url
                    <UrlRow url={item.button_url} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
