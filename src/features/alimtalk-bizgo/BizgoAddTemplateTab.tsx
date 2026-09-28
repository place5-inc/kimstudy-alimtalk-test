import { useState, useCallback } from "react";
import { callProxyPost, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

export function BizgoAddTemplateTab() {
  const [templateCode, setTemplateCode]     = useState("");
  const [description, setDescription]       = useState("");
  const [varInput, setVarInput]             = useState("");
  const [requiredVars, setRequiredVars]     = useState<string[]>([]);
  const [busy, setBusy]                     = useState(false);
  const [result, setResult]                 = useState<ResultState | null>(null);

  const { logout } = useAuth();

  const addVar = () => {
    const v = varInput.trim();
    if (v && !requiredVars.includes(v)) {
      setRequiredVars((prev) => [...prev, v]);
    }
    setVarInput("");
  };

  const removeVar = (v: string) => setRequiredVars((prev) => prev.filter((x) => x !== v));

  const handleVarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addVar(); }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!templateCode.trim()) { setResult({ ok: false, message: "templateCode를 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      try {
        const r = await callProxyPost("/admin/bizgo/add/template", {
          templateCode: templateCode.trim(),
          requiredVariables: requiredVars.length > 0 ? requiredVars : null,
          description: description.trim() || null,
        });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; result?: unknown };
        if (r.ok && json.isSuccess) {
          setResult({ ok: true, message: json.systemMessage || "등록 완료" });
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
    [templateCode, requiredVars, description, logout],
  );

  return (
    <div>
      <p className="page-title">비즈고 DB 추가</p>
      <p className="page-subtitle">비즈고 알림톡 템플릿을 DB에 등록합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">템플릿 등록</p>

        <div className="field">
          <label htmlFor="bat_code">
            templateCode <span className="required">*</span>
          </label>
          <input
            id="bat_code"
            type="text"
            placeholder="템플릿 코드 입력"
            autoComplete="off"
            value={templateCode}
            onChange={(e) => setTemplateCode(e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
        </div>

        <div className="field">
          <label>requiredVariables</label>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "#718096" }}>
            발송 시 필요한 변수명 목록. 예: nickname, link_mo, link_pc
          </p>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="변수명 입력 후 Enter 또는 추가"
              value={varInput}
              onChange={(e) => setVarInput(e.target.value)}
              onKeyDown={handleVarKeyDown}
              style={{ flex: 1, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontFamily: "monospace" }}
            />
            <button
              type="button"
              onClick={addVar}
              style={{ padding: "7px 14px", border: "1px solid #bee3f8", borderRadius: 6, background: "#ebf8ff", color: "#2b6cb0", fontSize: 12, cursor: "pointer" }}
            >
              추가
            </button>
          </div>
          {requiredVars.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {requiredVars.map((v) => (
                <span key={v} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 12,
                  background: "#ebf8ff", border: "1px solid #90cdf4",
                  fontSize: 12, color: "#2b6cb0", fontFamily: "monospace",
                }}>
                  #{v}
                  <button
                    type="button"
                    onClick={() => removeVar(v)}
                    style={{ background: "none", border: "none", color: "#90cdf4", cursor: "pointer", padding: 0, fontSize: 12, lineHeight: 1 }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="bat_desc">description</label>
          <input
            id="bat_desc"
            type="text"
            placeholder="템플릿 설명 (선택)"
            autoComplete="off"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "등록 중..." : "등록"}
        </button>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
