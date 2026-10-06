import { useState, useCallback } from "react";
import { callProxy, callProxyPost, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

interface Nation {
  name: string;
  iso_code: string;
}

export function OverseasIdentityVerifyTab() {
  // 완료처리 상태
  const [nickname, setNickname]         = useState("");
  const [birth, setBirth]               = useState("");
  const [nationality, setNationality]   = useState("");
  const [nations, setNations]           = useState<Nation[]>([]);
  const [nationsLoading, setNationsLoading] = useState(false);
  const [nationsError, setNationsError]     = useState<string | null>(null);
  const [busyComplete, setBusyComplete] = useState(false);
  const [resultComplete, setResultComplete] = useState<ResultState | null>(null);

  // 반려처리 상태
  const [rejectNickname, setRejectNickname] = useState("");
  const [rejectMent, setRejectMent]         = useState("");
  const [busyReject, setBusyReject]         = useState(false);
  const [resultReject, setResultReject]     = useState<ResultState | null>(null);

  const { logout }          = useAuth();
  const { env }             = useEnv();
  const { show: showToast } = useToast();

  const loadNations = useCallback(async () => {
    if (nations.length > 0 || nationsLoading) return;
    setNationsLoading(true);
    try {
      const r = await callProxy("/admin/test/abroad/get/nationality", {});
      if (!r.ok) { setNationsError(`국가 목록 로드 실패 (${r.status})`); return; }
      const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; list?: Nation[] };
      if (json.isSuccess && json.list) setNations(json.list);
      else setNationsError(json.systemMessage ?? "국가 목록 로드 실패");
    } catch (e) {
      setNationsError(String(e));
    } finally {
      setNationsLoading(false);
    }
  }, [nations.length, nationsLoading]);

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (value.length === 1) void loadNations();
  };

  const handleComplete = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim())  { setResultComplete({ ok: false, message: "닉네임을 입력해주세요." }); return; }
      if (!birth.trim())     { setResultComplete({ ok: false, message: "생년월일을 입력해주세요." }); return; }
      if (!nationality)      { setResultComplete({ ok: false, message: "국적을 선택해주세요." }); return; }

      setBusyComplete(true);
      setResultComplete(null);
      try {
        const r = await callProxy("/admin/test/abroad/auth/complete", {
          nickname: nickname.trim(),
          birth: birth.trim(),
          nationality,
        }, { env });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          showToast("완료되었습니다");
          setResultComplete({ ok: true, message: json.systemMessage ?? "신원인증 완료처리 성공" });
        } else {
          setResultComplete({ ok: false, message: json.systemMessage ?? `실패 (${r.status})` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setResultComplete({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setBusyComplete(false);
      }
    },
    [nickname, birth, nationality, env, logout, showToast],
  );

  const handleReject = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!rejectNickname.trim()) { setResultReject({ ok: false, message: "닉네임을 입력해주세요." }); return; }
      if (!rejectMent.trim())     { setResultReject({ ok: false, message: "반려사유를 입력해주세요." }); return; }

      setBusyReject(true);
      setResultReject(null);
      try {
        const r = await callProxyPost("/admin/test/abroad/auth/reject", {
          nickname: rejectNickname.trim(),
          rejectMent: rejectMent.trim(),
        }, { env });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          showToast("반려처리 완료");
          setResultReject({ ok: true, message: json.systemMessage ?? "신원인증 반려처리 성공" });
        } else {
          setResultReject({ ok: false, message: json.systemMessage ?? `실패 (${r.status})` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setResultReject({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setBusyReject(false);
      }
    },
    [rejectNickname, rejectMent, env, logout, showToast],
  );

  const selectedNation = nations.find((n) => n.iso_code === nationality);

  return (
    <div>
      <p className="page-title">신원인증처리</p>
      <p className="page-subtitle">해외 사용자의 신원인증을 완료 또는 반려 처리합니다.</p>

      {/* 완료처리 */}
      <form className="section" onSubmit={(e) => void handleComplete(e)} noValidate>
        <p className="section-title">완료처리</p>

        <div className="field">
          <label htmlFor="iv_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="iv_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="iv_birth">
            birth <span className="required">*</span>
          </label>
          <input
            id="iv_birth"
            type="text"
            placeholder="yyyy-MM-dd (예: 1995-03-22)"
            autoComplete="off"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#718096" }}>
            yyyy-MM-dd 형식으로 입력해주세요.
          </p>
        </div>

        <div className="field">
          <label htmlFor="iv_nationality">
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
                id="iv_nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px",
                  border: "1px solid #e2e8f0", borderRadius: 6,
                  fontSize: 13, background: "#fff",
                  color: nationality ? "#1a202c" : "#a0aec0",
                }}
              >
                <option value="">— 닉네임 입력 후 국적을 선택해주세요 —</option>
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

        <button type="submit" className="btn btn-send" disabled={busyComplete || nationsLoading}>
          {busyComplete ? "처리 중..." : "완료처리"}
        </button>

        <ResultBox result={resultComplete} />
      </form>

      {/* 반려처리 */}
      <form className="section" onSubmit={(e) => void handleReject(e)} noValidate>
        <p className="section-title">반려처리</p>

        <div className="field">
          <label htmlFor="rj_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="rj_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={rejectNickname}
            onChange={(e) => setRejectNickname(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="rj_ment">
            반려사유 <span className="required">*</span>
          </label>
          <input
            id="rj_ment"
            type="text"
            placeholder="반려사유 입력"
            autoComplete="off"
            value={rejectMent}
            onChange={(e) => setRejectMent(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busyReject}>
          {busyReject ? "처리 중..." : "반려처리"}
        </button>

        <ResultBox result={resultReject} />
      </form>
    </div>
  );
}
