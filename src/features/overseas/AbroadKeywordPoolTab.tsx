import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

interface KeywordData {
  searchTextKo?: string;
  searchTextEn?: string;
  searchTextJa?: string;
  searchTextZh?: string;
  searchTextVi?: string;
}

const LANGS: { key: keyof KeywordData; label: string }[] = [
  { key: "searchTextKo", label: "한국어 검색용 풀" },
  { key: "searchTextEn", label: "영어 검색용 풀" },
  { key: "searchTextJa", label: "일본어 검색용 풀" },
  { key: "searchTextZh", label: "중국어 검색용 풀" },
  { key: "searchTextVi", label: "베트남어 검색용 풀" },
];

export function AbroadKeywordPoolTab() {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy]         = useState(false);
  const [result, setResult]     = useState<ResultState | null>(null);
  const [data, setData]         = useState<KeywordData | null>(null);

  const { logout } = useAuth();
  const { env }    = useEnv();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) { setResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      setData(null);
      try {
        const r = await callProxy("/admin/test/rebuild/language/tutor", {
          nickname: nickname.trim(),
        }, { env });

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; data?: KeywordData };
        if (r.ok && json.isSuccess) {
          setData(json.data ?? null);
          setResult({ ok: true, message: json.systemMessage || "조회 성공" });
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
    [nickname, env, logout],
  );

  return (
    <div>
      <p className="page-title">키워드 검색용 풀 확인</p>
      <p className="page-subtitle">선생님의 다국어 검색용 키워드 풀을 재빌드하고 결과를 확인합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">키워드 풀 조회</p>

        <div className="field">
          <label htmlFor="kp_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="kp_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "조회 중..." : "조회"}
        </button>

        <ResultBox result={result} />
      </form>

      {data && (
        <div className="section" style={{ marginTop: 16 }}>
          <p className="section-title">검색용 풀 결과</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {LANGS.map(({ key, label }) => (
              <div key={key}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "#4a5568" }}>{label}</p>
                <div style={{
                  padding: "10px 14px",
                  background: data[key] ? "#f7fafc" : "#fff5f5",
                  border: `1px solid ${data[key] ? "#e2e8f0" : "#fed7d7"}`,
                  borderRadius: 6,
                  fontSize: 13,
                  color: data[key] ? "#1a202c" : "#a0aec0",
                  wordBreak: "break-all",
                  lineHeight: 1.6,
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                }}>
                  {data[key] || "— 데이터 없음 —"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
