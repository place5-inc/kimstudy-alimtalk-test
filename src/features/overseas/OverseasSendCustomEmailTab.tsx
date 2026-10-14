import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { useToast } from "../../shared/ui/Toast";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

const TEMPLATES = [
  { code: "join_stpr_01_01_v2",               desc: "가입 환영" },
  { code: "msg_pt_of_sc_00",                  desc: "새 과외문의" },
  { code: "cus_stpr_01_v2",                   desc: "N건 제안 요약" },
  { code: "msg_stpr_02_01_v2",                desc: "선생님 답장" },
  { code: "msg_stpr_02_04_v2",                desc: "선생님 답장 (답변 유도)" },
  { code: "bizp_2026040708573825806856732",    desc: "수업 시작 알림 요청" },
  { code: "bizp_2026040709050112312208609",    desc: "정규 전환 알림 요청" },
  { code: "crbt_mch_prt_wth_sbjt_v1",         desc: "과외 성사 축하" },
  { code: "rqst_rv_1st_v1_new",               desc: "후기 요청 (2주)" },
  { code: "rqst_rv_2nd_v1",                   desc: "후기 재요청" },
  { code: "noti_cs_center_v1",                desc: "고객센터 메시지" },
  { code: "bizp_2026041510444512312855998",    desc: "휴면 전환 안내" },
  { code: "bizp_2026060214373715156144015",    desc: "현금영수증 발급" },
  { code: "pay_cont_all_03_v2",               desc: "학습자료실 캐시 구매" },
  { code: "pmt_rqst_usr_1st_v1",              desc: "수업료 납부 요청서 (최초)" },
  { code: "pmt_rqst_usr_2nd_v1",              desc: "수업료 납부 요청" },
] as const;

type TemplateCode = (typeof TEMPLATES)[number]["code"];

const KOREAN_ONLY = new Set<string>([
  "bizp_2026060214373715156144015",
  "pay_cont_all_03_v2",
]);

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

interface ButtonUrlResponse {
  isSuccess: boolean;
  systemMessage: string | null;
  url: string | null;
  isSchedulerTarget: boolean;
  guides: string[];
  warnings: string[];
  detail: {
    roomId?: string;
    latestTutorMessageAt?: string;
    offerUserRole?: string;
    offerPaymentMethod?: string;
    tutorNickname?: string;
    tutorReplyRoomCount?: number;
    receiverType?: string;
  } | null;
}

// ── 우측: 버튼 URL 확인 패널 ───────────────────────────────
function UrlCheckerPanel({
  templateCode,
  onPaste,
}: {
  templateCode: string;
  onPaste: (url: string) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy]         = useState(false);
  const [data, setData]         = useState<ButtonUrlResponse | null>(null);
  const [result, setResult]     = useState<ResultState | null>(null);

  const { logout } = useAuth();
  const { env }    = useEnv();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!templateCode.trim()) { setResult({ ok: false, message: "위에서 템플릿을 선택해주세요." }); return; }
      if (!nickname.trim())     { setResult({ ok: false, message: "nickname을 입력해주세요." }); return; }

      setBusy(true);
      setData(null);
      setResult(null);
      try {
        const r = await callProxy("/admin/test/abroad/make/email/button/url", {
          templateCode: templateCode.trim(),
          nickname: nickname.trim(),
        }, { env });

        const json = JSON.parse(r.body) as ButtonUrlResponse;
        setData(json);
        if (r.ok && json.isSuccess) {
          setResult({ ok: true, message: json.url ? "URL 생성 완료" : "스케줄러 대상 (고정 URL)" });
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
    [templateCode, nickname, env, logout],
  );

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">버튼 URL 확인</p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#718096" }}>
          템플릿 코드로 발송에 넣을 버튼 URL을 미리 확인합니다.
        </p>

        <div className="field">
          <label htmlFor="uc_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="uc_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "조회 중..." : "URL 확인"}
        </button>

        <ResultBox result={result} />
      </form>

      {data && (
        <div className="section" style={{ marginTop: 12 }}>
          <p className="section-title">확인 결과</p>

          {data.url && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#2d3748" }}>생성된 URL</p>
              <div style={{
                padding: "10px 12px", background: "#f0fff4", border: "1px solid #9ae6b4",
                borderRadius: 6, wordBreak: "break-all", fontSize: 12, fontFamily: "monospace",
                color: "#22543d", marginBottom: 8,
              }}>
                {data.url}
              </div>
              <button
                type="button"
                onClick={() => onPaste(data.url!)}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 600,
                  background: "#3182ce", color: "#fff", border: "none",
                  borderRadius: 6, cursor: "pointer",
                }}
              >
                ← 발송 탭 URL에 붙여넣기
              </button>
            </div>
          )}

          {data.guides.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#744210" }}>URL 생성 전 필요 작업</p>
              {data.guides.map((g, i) => (
                <div key={i} style={{
                  padding: "7px 12px", background: "#fffbeb", border: "1px solid #f6e05e",
                  borderRadius: 6, fontSize: 12, color: "#744210", marginBottom: 4,
                }}>
                  {i + 1}. {g}
                </div>
              ))}
            </div>
          )}

          {data.warnings.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#c53030" }}>주의사항</p>
              {data.warnings.map((w, i) => (
                <div key={i} style={{
                  padding: "7px 12px", background: "#fff5f5", border: "1px solid #fed7d7",
                  borderRadius: 6, fontSize: 12, color: "#c53030", marginBottom: 4,
                }}>
                  ⚠️ {w}
                </div>
              ))}
            </div>
          )}

          {data.detail && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#2d3748" }}>상세 정보</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(data.detail).filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={k} style={{
                    display: "flex", gap: 8, padding: "6px 10px",
                    background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 6,
                  }}>
                    <span style={{ minWidth: 170, fontSize: 11, color: "#718096", flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 12, color: "#1a202c", fontFamily: "monospace", wordBreak: "break-all" }}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 메인 탭 ──────────────────────────────────────────────────
export function OverseasSendCustomEmailTab() {
  const [templateCode, setTemplateCode] = useState<TemplateCode | "">("");
  const [toEmail, setToEmail]           = useState("");
  const [receiverType, setReceiverType] = useState<"korean" | "foreigner">("foreigner");
  const [languageCode, setLanguageCode] = useState("en");
  const [url, setUrl]                   = useState("");
  const [busy, setBusy]                 = useState(false);
  const [result, setResult]             = useState<ResultState | null>(null);

  const { logout }           = useAuth();
  const { env }              = useEnv();
  const { show: showToast }  = useToast();

  const isKoreanOnly      = KOREAN_ONLY.has(templateCode);
  const effectiveReceiver = isKoreanOnly ? "korean" : receiverType;
  const effectiveLang     = effectiveReceiver === "korean" ? "ko" : languageCode;
  const selectedTemplate  = TEMPLATES.find((t) => t.code === templateCode);

  const handleTemplateChange = (code: string) => {
    setTemplateCode(code as TemplateCode | "");
    if (KOREAN_ONLY.has(code)) {
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
      if (!toEmail.trim()) { setResult({ ok: false, message: "이메일을 입력해주세요." }); return; }
      if (!templateCode)   { setResult({ ok: false, message: "템플릿을 선택해주세요." }); return; }
      if (!url.trim())     { setResult({ ok: false, message: "버튼 URL을 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      try {
        const r = await callProxy("/admin/test/abroad/send/custom/email", {
          toEmail: toEmail.trim(),
          templateCode,
          receiverType: effectiveReceiver,
          languageCode: effectiveLang,
          url: url.trim(),
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
    [toEmail, templateCode, effectiveReceiver, effectiveLang, url, env, logout, showToast],
  );

  return (
    <div>
      <p className="page-title">이메일 발송 (버튼 URL)</p>
      <p className="page-subtitle">버튼 URL을 직접 지정해 테스트 이메일을 발송합니다. 우측에서 URL을 먼저 확인하세요.</p>

      {/* ── 공통: 템플릿 선택 ──────────────────────────────── */}
      <div className="section">
        <p className="section-title">템플릿 선택 <span className="required">*</span></p>
        <select
          value={templateCode}
          onChange={(e) => handleTemplateChange(e.target.value)}
          style={{
            width: "100%", padding: "9px 12px",
            border: "1px solid #e2e8f0", borderRadius: 6,
            fontSize: 13, background: "#fff", color: templateCode ? "#1a202c" : "#a0aec0",
          }}
        >
          <option value="">— 템플릿을 선택하세요 —</option>
          {TEMPLATES.map(({ code, desc }) => (
            <option key={code} value={code}>
              {desc}{KOREAN_ONLY.has(code) ? " ★" : ""}　　{code}
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
                {selectedTemplate.desc}
                {isKoreanOnly && (
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
      </div>

      {/* ── 좌우 분할 ──────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* ── 좌측: 발송 폼 ─────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
            <p className="section-title">발송 정보 입력</p>

            <div className="field">
              <label htmlFor="ce_toEmail">
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
                  id="ce_toEmail"
                  type="email"
                  placeholder="abcd@place5.com"
                  autoComplete="off"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  style={{ paddingLeft: 36, width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div className="field">
              <label>
                수신자 유형 <span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {RECEIVER_OPTIONS.map(({ value, label, desc }) => {
                  const disabled = isKoreanOnly && value === "foreigner";
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
              {isKoreanOnly && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#c53030" }}>
                  ⚠️ 선택한 템플릿은 해외거주 한국인 전용이라 수신자 유형이 고정됩니다.
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="ce_languageCode">
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

            <div className="field">
              <label htmlFor="ce_url">
                버튼 URL <span className="required">*</span>
              </label>
              <input
                id="ce_url"
                type="text"
                placeholder="https://..."
                autoComplete="off"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ fontFamily: "monospace", fontSize: 12 }}
              />
              {!url.trim() && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#c53030" }}>
                  우측에서 URL을 확인하고 붙여넣은 후 발송하세요.
                </p>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <button
                type="submit"
                className="btn btn-send"
                disabled={busy || !toEmail.trim() || !url.trim()}
                style={{ minWidth: 120 }}
              >
                {busy ? "발송 중..." : "📧 발송"}
              </button>
            </div>

            <ResultBox result={result} />
          </form>
        </div>

        {/* ── 우측: URL 확인 패널 ───────────────────────────── */}
        <UrlCheckerPanel templateCode={templateCode} onPaste={(pastedUrl) => setUrl(pastedUrl)} />
      </div>
    </div>
  );
}
