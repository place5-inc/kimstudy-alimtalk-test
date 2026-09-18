import { useState, useEffect, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

interface Nation {
  name: string;
  iso_code: string;
}

export function OverseasNationalityChangeTab() {
  const [nickname, setNickname]       = useState("");
  const [nationality, setNationality] = useState("");
  const [nations, setNations]         = useState<Nation[]>([]);
  const [nationsLoading, setNationsLoading] = useState(true);
  const [nationsError, setNationsError]     = useState<string | null>(null);
  const [busy, setBusy]               = useState(false);
  const [result, setResult]           = useState<ResultState | null>(null);

  const { logout }          = useAuth();
  const { env }             = useEnv();
  const { show: showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await callProxy("/admin/test/abroad/get/nationality", {});
        if (!r.ok) { setNationsError(`국가 목록 로드 실패 (${r.status})`); return; }
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; list?: Nation[] };
        if (!cancelled) {
          if (json.isSuccess && json.list) setNations(json.list);
          else setNationsError(json.systemMessage ?? "국가 목록 로드 실패");
        }
      } catch (e) {
        if (!cancelled) setNationsError(String(e));
      } finally {
        if (!cancelled) setNationsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }
      if (!nationality)     { setResult({ ok: false, message: "국적을 선택해주세요." }); return; }

      setBusy(true);
      setResult(null);
      try {
        const r = await callProxy("/admin/test/abroad/change/nationality", {
          nickname: nickname.trim(),
          nationality,
        }, { env });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          showToast("완료되었습니다");
          setResult({ ok: true, message: json.systemMessage ?? "국적 변경 완료" });
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
    [nickname, nationality, env, logout, showToast],
  );

  const selectedNation = nations.find((n) => n.iso_code === nationality);

  return (
    <div>
      <p className="page-title">국적 변경</p>
      <p className="page-subtitle">해외 사용자의 국적 정보를 변경합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">국적 변경</p>

        {/* nickname */}
        <div className="field">
          <label htmlFor="nc_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="nc_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        {/* nationality */}
        <div className="field">
          <label htmlFor="nc_nationality">
            nationality <span className="required">*</span>
          </label>
          {nationsLoading ? (
            <div style={{ padding: "10px 12px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, color: "#a0aec0" }}>
              국가 목록 로딩 중...
            </div>
          ) : nationsError ? (
            <div style={{ padding: "10px 12px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 6, fontSize: 13, color: "#c53030" }}>
              {nationsError}
            </div>
          ) : (
            <>
              <select
                id="nc_nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px",
                  border: "1px solid #e2e8f0", borderRadius: 6,
                  fontSize: 13, background: "#fff",
                  color: nationality ? "#1a202c" : "#a0aec0",
                }}
              >
                <option value="">— 국적을 선택하세요 —</option>
                {nations.map((n) => (
                  <option key={n.iso_code} value={n.iso_code}>
                    {n.name}　({n.iso_code})
                  </option>
                ))}
              </select>
              {selectedNation && (
                <div style={{
                  marginTop: 8, padding: "8px 14px",
                  background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 8,
                  display: "flex", alignItems: "center", gap: 10, fontSize: 13,
                }}>
                  <span style={{ fontWeight: 700, color: "#276749" }}>{selectedNation.name}</span>
                  <span style={{ color: "#718096", fontFamily: "monospace", fontSize: 12 }}>ISO: {selectedNation.iso_code}</span>
                </div>
              )}
            </>
          )}
        </div>

        <button type="submit" className="btn btn-send" disabled={busy || nationsLoading}>
          {busy ? "처리 중..." : "국적 변경"}
        </button>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
