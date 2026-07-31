import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";

interface ButtonUrlResult {
  message: string;
  button_url: string;
}

export function AlimtalkButtonUrlTab() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ButtonUrlResult[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { logout } = useAuth();
  const { env } = useEnv();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!phoneNumber.trim()) {
        setError("휴대폰 번호를 입력해주세요.");
        return;
      }

      setBusy(true);
      setError(null);
      setResults(null);
      setCopiedIndex(null);

      try {
        const r = await callProxy(
          "/admin/test/get/button/url",
          { phoneNumber: phoneNumber.trim() },
          { env },
        );

        if (r.ok) {
          try {
            const json = JSON.parse(r.body) as {
              isSuccess?: boolean;
              result?: ButtonUrlResult[];
            };
            if (json.result && json.result.length > 0) {
              setResults(json.result);
            } else {
              setResults([]);
            }
          } catch {
            setError(`응답 파싱 실패: ${r.body}`);
          }
        } else {
          setError(`실패 (${r.status}) ${r.body}`);
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) {
          await logout();
          return;
        }
        setError(`오류: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [phoneNumber, env, logout],
  );

  const handleCopy = useCallback((url: string, index: number) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }, []);

  return (
    <div>
      <p className="page-title">알림톡 버튼 URL 확인</p>
      <p className="page-subtitle">
        최근 발송 성공한 알림톡 최대 5건의 버튼 URL을 조회합니다.
      </p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">🔍 버튼 URL 조회</p>

        <div className="field">
          <label htmlFor="alimtalk_phone">
            휴대폰 번호 <span className="required">*</span>
          </label>
          <input
            id="alimtalk_phone"
            type="text"
            placeholder="예) 01012345678"
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
        <div className="result-box result-error" role="status" aria-live="polite">
          {error}
        </div>
      )}

      {results !== null && results.length === 0 && (
        <div className="result-box result-error" role="status" aria-live="polite">
          조회된 알림톡 로그가 없습니다.
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {results.map((item, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* 헤더 */}
              <div
                style={{
                  background: "#f7fafc",
                  borderBottom: "1px solid #e2e8f0",
                  padding: "8px 14px",
                  fontSize: 12,
                  color: "#718096",
                  fontWeight: 600,
                }}
              >
                #{index + 1} — 최근 발송 알림톡
              </div>

              {/* 메시지 미리보기 */}
              <div style={{ padding: "12px 14px 0" }}>
                <p style={{ fontSize: 12, color: "#718096", marginBottom: 4 }}>
                  알림톡 내용
                </p>
                <pre
                  style={{
                    fontSize: 12,
                    lineHeight: 1.7,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    background: "#f7fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    padding: "8px 12px",
                    maxHeight: 120,
                    overflowY: "auto",
                    color: "#2d3748",
                  }}
                >
                  {item.message}
                </pre>
              </div>

              {/* 버튼 URL */}
              <div style={{ padding: "12px 14px" }}>
                <p style={{ fontSize: 12, color: "#718096", marginBottom: 6 }}>
                  버튼 URL
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code
                    style={{
                      flex: 1,
                      fontSize: 12,
                      background: "#edf2f7",
                      padding: "7px 10px",
                      borderRadius: 6,
                      wordBreak: "break-all",
                      color: "#2b6cb0",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.button_url}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.button_url, index)}
                    style={{
                      flexShrink: 0,
                      padding: "7px 14px",
                      borderRadius: 6,
                      border: "none",
                      background: copiedIndex === index ? "#38a169" : "#3182ce",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 0.2s",
                    }}
                  >
                    {copiedIndex === index ? "복사됨 ✓" : "복사"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
