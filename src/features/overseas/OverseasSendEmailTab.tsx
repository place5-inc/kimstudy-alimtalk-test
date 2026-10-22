import { useState, useCallback, useEffect } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

interface TemplateItem {
  templateCode: string;
  description: string;
  receiverTypes: string[];
}

const LANG_OPTIONS = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "영어" },
  { value: "ja", label: "일본어" },
  { value: "zh", label: "중국어" },
  { value: "vi", label: "베트남어" },
] as const;

const RECEIVER_OPTIONS = [
  { value: "foreigner", label: "외국인", desc: "외국인 사용자" },
  { value: "korean",    label: "해외거주 한국인", desc: "해외에 거주하는 한국인" },
] as const;

function isKoreanOnly(t: TemplateItem) {
  return t.receiverTypes.length === 1 && t.receiverTypes[0] === "korean";
}

export function OverseasSendEmailTab() {
  const [templates, setTemplates]       = useState<TemplateItem[]>([]);
  const [templatesLoading, setTLoading] = useState(false);
  const [templatesError, setTError]     = useState<string | null>(null);

  const [toEmail, setToEmail]           = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [receiverType, setReceiverType] = useState<"korean" | "foreigner">("foreigner");
  const [languageCode, setLanguageCode] = useState("en");
  const [busy, setBusy]                 = useState(false);
  const [result, setResult]             = useState<ResultState | null>(null);

  const { logout }           = useAuth();
  const { env }              = useEnv();
  const { show: showToast }  = useToast();

  useEffect(() => {
    setTLoading(true);
    callProxy("/admin/test/abroad/get/templateCode", {}, { env })
      .then((r) => {
        if (!r.body.trim()) { setTError(`템플릿 목록 로드 실패 (${r.status})`); return; }
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage?: string | null; list?: TemplateItem[] };
        if (json.isSuccess && json.list) setTemplates(json.list);
        else setTError(`템플릿 목록 로드 실패: ${json.systemMessage ?? "알 수 없는 오류"}`);
      })
      .catch((e: unknown) => setTError(`템플릿 목록 로드 실패: ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setTLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTemplate = templates.find((t) => t.templateCode === templateCode);
  const koreanOnly = selectedTemplate ? isKoreanOnly(selectedTemplate) : false;
  const effectiveReceiver = koreanOnly ? "korean" : receiverType;
  const effectiveLang     = effectiveReceiver === "korean" ? "ko" : languageCode;

  const handleTemplateChange = (code: string) => {
    setTemplateCode(code);
    const t = templates.find((x) => x.templateCode === code);
    if (t && isKoreanOnly(t)) {
      setReceiverType("korean");
      setLanguageCode("ko");
    }
  };

  const handleReceiverChange = (type: "korean" | "foreigner") => {
    setReceiverType(type);
    setLanguageCode(type === "korean" ? "ko" : "en");
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!toEmail.trim())  { setResult({ ok: false, message: "이메일을 입력해주세요." }); return; }
      if (!templateCode)    { setResult({ ok: false, message: "템플릿을 선택해주세요." }); return; }

      setBusy(true);
      setResult(null);
      try {
        const r = await callProxy("/admin/test/abroad/send/email", {
          toEmail: toEmail.trim(),
          templateCode,
          receiverType: effectiveReceiver,
          languageCode: effectiveLang,
        }, { env });

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
    [toEmail, templateCode, effectiveReceiver, effectiveLang, env, logout, showToast],
  );

  return (
    <div>
      <p className="page-title">이메일 발송</p>
      <p className="page-subtitle">Azure를 통해 해외 사용자에게 테스트 이메일을 발송합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">발송 정보 입력</p>

        {/* ── 수신 이메일 ─────────────────────────────────────── */}
        <div className="field">
          <label htmlFor="se_toEmail">
            수신 이메일 <span className="required">*</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, pointerEvents: "none", color: "#a0aec0",
            }}>
              ✉️
            </span>
            <input
              id="se_toEmail"
              type="email"
              placeholder="abcd@place5.com"
              autoComplete="off"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              style={{ paddingLeft: 36, width: "100%", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* ── 템플릿 선택 ─────────────────────────────────────── */}
        <div className="field">
          <label htmlFor="se_templateCode">
            템플릿 <span className="required">*</span>
          </label>
          {templatesLoading ? (
            <div style={{ padding: "10px 12px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, color: "#a0aec0" }}>
              템플릿 목록 로딩 중...
            </div>
          ) : templatesError ? (
            <div style={{ padding: "10px 12px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 6, fontSize: 13, color: "#c53030" }}>
              {templatesError}
            </div>
          ) : (
            <>
              <select
                id="se_templateCode"
                value={templateCode}
                onChange={(e) => handleTemplateChange(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px",
                  border: "1px solid #e2e8f0", borderRadius: 6,
                  fontSize: 13, background: "#fff", color: templateCode ? "#1a202c" : "#a0aec0",
                }}
              >
                <option value="">— 템플릿을 선택하세요 —</option>
                {templates.map((t) => (
                  <option key={t.templateCode} value={t.templateCode}>
                    {t.description}{isKoreanOnly(t) ? " ★" : ""}　　{t.templateCode}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div style={{
                  marginTop: 8, padding: "10px 14px",
                  background: "#f0f9ff", border: "1px solid #bee3f8", borderRadius: 8,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 18 }}>📧</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a202c" }}>
                      {selectedTemplate.description}
                      {koreanOnly && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: "#c53030", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 4, padding: "1px 6px" }}>
                          해외거주 한국인 전용
                        </span>
                      )}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#718096", fontFamily: "monospace" }}>
                      {templateCode}
                    </p>
                  </div>
                </div>
              )}
              {!templateCode && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#a0aec0" }}>
                  ★ 표시 템플릿은 해외거주 한국인 전용입니다.
                </p>
              )}
            </>
          )}
        </div>

        {/* ── 수신자 유형 ─────────────────────────────────────── */}
        <div className="field">
          <label>
            수신자 유형 <span className="required">*</span>
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {RECEIVER_OPTIONS.map(({ value, label, desc }) => {
              const disabled = koreanOnly && value === "foreigner";
              const selected = effectiveReceiver === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && handleReceiverChange(value as "korean" | "foreigner")}
                  style={{
                    flex: 1, padding: "10px 14px", border: "2px solid",
                    borderColor: selected ? "#3182ce" : "#e2e8f0",
                    borderRadius: 8, background: selected ? "#ebf8ff" : "#fff",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.4 : 1,
                    textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: selected ? "#2b6cb0" : "#4a5568" }}>
                    {selected ? "✓ " : ""}{label}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#718096" }}>{desc}</p>
                </button>
              );
            })}
          </div>
          {koreanOnly && (
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#c53030" }}>
              ⚠️ 선택한 템플릿은 해외거주 한국인 전용이라 수신자 유형이 고정됩니다.
            </p>
          )}
        </div>

        {/* ── 언어 코드 ────────────────────────────────────────── */}
        <div className="field">
          <label htmlFor="se_languageCode">
            수신 언어 <span className="required">*</span>
          </label>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "#718096" }}>
            수신자가 받을 이메일의 언어 버전입니다.
          </p>
          {effectiveReceiver === "korean" ? (
            <div style={{
              padding: "10px 14px", background: "#f7fafc", border: "1px solid #e2e8f0",
              borderRadius: 8, color: "#718096", fontSize: 13,
            }}>
              🇰🇷 한국어 (ko) — 해외거주 한국인은 한국어 고정
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {LANG_OPTIONS.map(({ value, label }) => {
                const selected = languageCode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLanguageCode(value)}
                    style={{
                      padding: "7px 16px", border: "2px solid",
                      borderColor: selected ? "#3182ce" : "#e2e8f0",
                      borderRadius: 20, fontSize: 12, fontWeight: selected ? 700 : 400,
                      background: selected ? "#ebf8ff" : "#fff",
                      color: selected ? "#2b6cb0" : "#4a5568",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {selected ? "✓ " : ""}{label} ({value})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 발송 버튼 ────────────────────────────────────────── */}
        <div style={{ marginTop: 8 }}>
          <button type="submit" className="btn btn-send" disabled={busy || templatesLoading} style={{ minWidth: 120 }}>
            {busy ? "발송 중..." : "📧 발송"}
          </button>
        </div>

        <ResultBox result={result} />
      </form>
    </div>
  );
}
