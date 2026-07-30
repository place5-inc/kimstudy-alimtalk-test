import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";

export function CloneRequestTab() {
  const [requestId, setRequestId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clonedId, setClonedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { logout } = useAuth();
  const { env } = useEnv();
  const { show: showToast } = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!requestId.trim()) {
        setError("모집공고 ID를 입력해주세요.");
        return;
      }

      setBusy(true);
      setError(null);
      setClonedId(null);
      setCopied(false);

      try {
        const r = await callProxy(
          "/admin/test/clone/request",
          { requestId: requestId.trim() },
          { env },
        );
        if (r.ok) {
          try {
            const json = JSON.parse(r.body) as {
              isSuccess?: boolean;
              systemMessage?: string;
              data?: string;
            };
            if (json.data) {
              // "복제된 모집공고의 id는 {guid} 입니다." 에서 guid 추출
              const match = json.data.match(
                /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
              );
              setClonedId(match ? match[1] : json.data);
            } else {
              setError(`성공했지만 data 필드가 없습니다. 원본 응답: ${r.body}`);
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
        showToast("완료되었습니다");
      }
    },
    [requestId, env, logout, showToast],
  );

  const handleCopy = useCallback(() => {
    if (!clonedId) return;
    void navigator.clipboard.writeText(clonedId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [clonedId]);

  return (
    <div>
      <p className="page-title">모집공고 복제생성</p>
      <p
        className="page-subtitle"
        style={{ color: "#e53e3e", fontWeight: 600 }}
      >
        ⚠️ 주의: 테스터 본인의 모집공고 id만 복제해주세요! 복제된 공고는
        자동으로 '과외급합' 상태가 됩니다.
      </p>
      <form
        className="section"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
      >
        <p className="section-title">📋 모집공고 복제생성</p>

        <div className="field">
          <label htmlFor="clone_request_id">
            모집공고 ID <span className="required">*</span>
          </label>
          <input
            id="clone_request_id"
            type="text"
            placeholder="예) 3fa85f64-5717-4562-b3fc-2c963f66afa6"
            autoComplete="off"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
          />
          <p className="hint">
            웹 모집공고 상세 페이지 URL에서 확인할 수 있는 GUID 값입니다.
          </p>
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "처리 중..." : "복제"}
        </button>

        {error && (
          <div
            className="result-box result-error"
            role="status"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {clonedId && (
          <div
            className="result-box result-success"
            role="status"
            aria-live="polite"
          >
            <p style={{ marginBottom: 8 }}>✅ 복제 완료! 새 모집공고 ID:</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <code
                style={{
                  flex: 1,
                  background: "rgba(0,0,0,0.1)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 14,
                  wordBreak: "break-all",
                }}
              >
                {clonedId}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: copied ? "#38a169" : "#3182ce",
                  color: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "복사됨 ✓" : "복사"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
