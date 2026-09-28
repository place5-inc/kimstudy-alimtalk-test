import { useState, useCallback } from "react";
import { callProxyPost, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

interface KvRow { key: string; value: string }

export function AlimtalkBizgoReplaceTab() {
  const [templateCode, setTemplateCode] = useState("");
  const [phoneNumber, setPhoneNumber]   = useState("");
  const [rows, setRows]                 = useState<KvRow[]>([{ key: "", value: "" }]);
  const [busy, setBusy]                 = useState(false);
  const [result, setResult]             = useState<ResultState | null>(null);
  const [resultData, setResultData]     = useState<unknown>(null);

  const { logout } = useAuth();

  const updateRow = (idx: number, field: keyof KvRow, val: string) =>
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const addRow    = () => setRows((prev) => [...prev, { key: "", value: "" }]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!templateCode.trim()) { setResult({ ok: false, message: "templateCode를 입력해주세요." }); return; }
      if (!phoneNumber.trim())  { setResult({ ok: false, message: "phoneNumber를 입력해주세요." }); return; }

      const replaceWords: Record<string, string> = {};
      for (const { key, value } of rows) {
        if (key.trim()) replaceWords[key.trim()] = value;
      }

      setBusy(true);
      setResult(null);
      setResultData(null);
      try {
        const r = await callProxyPost("/admin/bizgo/test/send", {
          templateCode: templateCode.trim(),
          phoneNumber: phoneNumber.trim(),
          replaceWords: Object.keys(replaceWords).length > 0 ? replaceWords : null,
        });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; result?: unknown };
        if (r.ok && json.isSuccess) {
          setResultData(json.result ?? null);
          setResult({ ok: true, message: json.systemMessage || "발송 성공" });
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
    [templateCode, phoneNumber, rows, logout],
  );

  return (
    <div>
      <p className="page-title">알림톡(비즈고) 교체 발송</p>
      <p className="page-subtitle">비즈고(Bizgo) 알림톡 서비스를 이용하여 알림톡을 테스트 발송합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">발송 정보</p>

        <div className="field">
          <label htmlFor="bz_template">
            templateCode <span className="required">*</span>
          </label>
          <input
            id="bz_template"
            type="text"
            placeholder="템플릿 코드 입력"
            autoComplete="off"
            value={templateCode}
            onChange={(e) => setTemplateCode(e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
        </div>

        <div className="field">
          <label htmlFor="bz_phone">
            phoneNumber <span className="required">*</span>
          </label>
          <input
            id="bz_phone"
            type="text"
            placeholder="예: 01012345678"
            autoComplete="off"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
        </div>

        <div className="field">
          <label>replaceWords</label>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "#718096" }}>
            템플릿 변수 치환값. 버튼 URL의 #{`link_mo`} 같은 변수도 여기에 함께 입력합니다.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rows.map((row, idx) => (
              <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="key (예: nickname)"
                  value={row.key}
                  onChange={(e) => updateRow(idx, "key", e.target.value)}
                  style={{ flex: 1, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontFamily: "monospace" }}
                />
                <span style={{ color: "#a0aec0", fontSize: 14 }}>:</span>
                <input
                  type="text"
                  placeholder="value (예: 홍길동)"
                  value={row.value}
                  onChange={(e) => updateRow(idx, "value", e.target.value)}
                  style={{ flex: 2, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }}
                />
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    style={{ padding: "4px 10px", border: "1px solid #fed7d7", borderRadius: 6, background: "#fff5f5", color: "#c53030", fontSize: 12, cursor: "pointer" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            style={{ marginTop: 8, padding: "5px 14px", border: "1px solid #bee3f8", borderRadius: 6, background: "#ebf8ff", color: "#2b6cb0", fontSize: 12, cursor: "pointer" }}
          >
            + 변수 추가
          </button>
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "발송 중..." : "발송"}
        </button>

        <ResultBox result={result} />
      </form>

      {resultData != null && (
        <div className="section" style={{ marginTop: 16 }}>
          <p className="section-title">응답 result</p>
          <pre style={{
            margin: 0, padding: "12px 14px",
            background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 6,
            fontSize: 12, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
          }}>
            {JSON.stringify(resultData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
