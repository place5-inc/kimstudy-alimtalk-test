import { useState } from "react";

type AnyObj = Record<string, unknown>;

const CI_TRANS_FIELDS = [
  ["pay_description",               "수업료 설명"],
  ["extra_schedule",                "추가 일정"],
  ["simple_introduction",           "한줄 소개"],
  ["class_description",             "수업 설명"],
  ["online_class_description",      "온라인 수업 설명"],
  ["subject_description",           "과목 설명"],
  ["differentiation",               "차별화"],
  ["appeal",                        "어필"],
  ["mbti_description",              "MBTI 설명"],
  ["demo_class_description",        "체험수업 설명"],
  ["feedback_cycle",                "피드백 주기"],
  ["feedback_method",               "피드백 방법"],
  ["homework_assignment_method",    "숙제 부과 방법"],
  ["homework_checking",             "숙제 확인"],
  ["homework_not_completed",        "숙제 미완료 시"],
  ["extra_service_qna",             "추가서비스 Q&A"],
  ["extra_service_coaching",        "추가서비스 코칭"],
  ["extra_service_consulting",      "추가서비스 컨설팅"],
  ["extra_service_assessment",      "추가서비스 평가"],
  ["extra_service_detail_speciality","추가서비스 전문성"],
  ["extra_service_etc",             "추가서비스 기타"],
  ["tutor_tip_concern",             "팁 - 고민"],
  ["tutor_tip_study_method",        "팁 - 공부법"],
  ["tutor_tip_result",              "팁 - 결과"],
] as const;

const MP_TRANS_FIELDS = CI_TRANS_FIELDS.filter(
  ([k]) => k !== "mbti_description" && !k.startsWith("tutor_tip"),
);

function trunc(v: unknown, n = 55): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function FieldTable({ obj, fields }: { obj: AnyObj; fields: readonly (readonly [string, string])[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <tbody>
        {fields.map(([key, label]) => {
          const val = obj[key];
          const hasVal = val !== null && val !== undefined && val !== "";
          return (
            <tr key={key} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "4px 8px", color: "#718096", fontWeight: 600, whiteSpace: "nowrap", width: "28%" }}>{label}</td>
              <td style={{ padding: "4px 8px", color: hasVal ? "#1a202c" : "#cbd5e0", wordBreak: "break-all" }}>
                {hasVal ? trunc(val) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TransTable({ t, fields }: { t: AnyObj; fields: readonly (readonly [string, string])[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
      <thead>
        <tr style={{ background: "#f7fafc" }}>
          <th style={{ padding: "4px 8px", textAlign: "left", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0", width: "20%" }}>필드</th>
          <th style={{ padding: "4px 8px", textAlign: "left", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>번역값</th>
          <th style={{ padding: "4px 8px", textAlign: "left", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>AI번역값</th>
          <th style={{ padding: "4px 8px", textAlign: "center", color: "#718096", fontWeight: 600, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>유저수정</th>
        </tr>
      </thead>
      <tbody>
        {fields.map(([key, label]) => {
          const val = t[key];
          const aiVal = t[`ai_${key}`];
          const isChanged = t[`is_changed_${key}`];
          const hasVal = val !== null && val !== undefined && val !== "";
          const hasAi = aiVal !== null && aiVal !== undefined && aiVal !== "";
          return (
            <tr key={key} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "4px 8px", color: "#718096", fontWeight: 600 }}>{label}</td>
              <td style={{ padding: "4px 8px", color: hasVal ? "#1a202c" : "#cbd5e0", wordBreak: "break-all" }}>{hasVal ? trunc(val) : "—"}</td>
              <td style={{ padding: "4px 8px", color: hasAi ? "#2b6cb0" : "#cbd5e0", wordBreak: "break-all" }}>{hasAi ? trunc(aiVal) : "—"}</td>
              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                {isChanged
                  ? <span style={{ color: "#c53030", fontWeight: 700 }}>✓</span>
                  : <span style={{ color: "#cbd5e0" }}>—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 10, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "#f7fafc", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 700, color: "#2d3748" }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 10, color: "#718096" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ padding: 10 }}>{children}</div>}
    </div>
  );
}

export function MultiLanguageTab() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnyObj | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/proxy/admin/test/get/whole/information?nickname=${encodeURIComponent(nickname.trim())}`,
        { headers: { "x-action": "patch2608:wholeInformation" } },
      );
      const json = (await res.json()) as AnyObj;
      if (!json.isSuccess) {
        setError(String(json.systemMessage ?? "오류 발생"));
      } else {
        setData(json.data as AnyObj);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const ci = data?.classInformation as AnyObj | null;
  const ciTrans = (data?.classInformationTranslations as AnyObj[]) ?? [];
  const multiProfiles = (data?.multiProfiles as AnyObj[]) ?? [];

  return (
    <div>
      <p className="page-title">다국어번역</p>

      <div className="guide-box" style={{ marginBottom: 16 }}>
        <p className="guide-title" style={{ margin: 0, fontSize: 13, color: "#4a5568" }}>
          기본소개서와 기본소개서의 각 언어버전(영어, 일본어, 중국어, 베트남어)<br />
          멀티소개서와 멀티소개서의 각 언어버전(영어, 일본어, 중국어, 베트남어)<br />
          의 입력된 정보와 번역된 정보를 볼 수 있습니다.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
          placeholder="선생님 닉네임"
          autoComplete="off"
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
        />
        <button
          type="button"
          disabled={loading || !nickname.trim()}
          onClick={() => void handleSearch()}
          style={{ padding: "8px 20px", background: "#3182ce", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          {loading ? "조회 중…" : "조회"}
        </button>
      </div>

      {error && <p style={{ color: "#c53030", fontSize: 13 }}>{error}</p>}

      {data && (
        <div>
          {/* 기본소개서 */}
          <Section title="📄 기본소개서" defaultOpen>
            {ci ? (
              <FieldTable obj={ci} fields={CI_TRANS_FIELDS} />
            ) : (
              <p style={{ fontSize: 13, color: "#718096" }}>데이터 없음</p>
            )}
          </Section>

          {/* 기본소개서 언어별 번역 */}
          <Section title={`🌐 기본소개서 번역 (${ciTrans.length}개 언어)`} defaultOpen={ciTrans.length > 0}>
            {ciTrans.length === 0 ? (
              <p style={{ fontSize: 13, color: "#718096" }}>번역 데이터 없음</p>
            ) : (
              ciTrans.map((t, i) => (
                <Section
                  key={i}
                  title={`${String(t.language_code)}  ·  AI번역: ${t.is_ai_translated ? "✓" : "✗"}  ·  데이터변경: ${t.isChangedData ? "✓" : "✗"}  ·  번역일: ${t.translated_at ? String(t.translated_at).slice(0, 10) : "—"}`}
                  defaultOpen={i === 0}
                >
                  <TransTable t={t} fields={CI_TRANS_FIELDS} />
                </Section>
              ))
            )}
          </Section>

          {/* 멀티소개서 */}
          <Section title={`📋 멀티소개서 (${multiProfiles.length}개)`} defaultOpen={multiProfiles.length > 0}>
            {multiProfiles.length === 0 ? (
              <p style={{ fontSize: 13, color: "#718096" }}>멀티소개서 없음</p>
            ) : (
              multiProfiles.map((mp, i) => {
                const profile = mp.profile as AnyObj;
                const translations = (mp.translations as AnyObj[]) ?? [];
                return (
                  <Section
                    key={i}
                    title={`#${i + 1} ${String(profile.name ?? "이름없음")}  ·  활성: ${profile.is_active ? "✓" : "✗"}  ·  순서: ${profile.order_seq ?? "-"}`}
                    defaultOpen={i === 0}
                  >
                    <Section title="소개서 내용" defaultOpen>
                      <FieldTable obj={profile} fields={MP_TRANS_FIELDS} />
                    </Section>
                    <Section title={`번역 (${translations.length}개 언어)`} defaultOpen={translations.length > 0}>
                      {translations.length === 0 ? (
                        <p style={{ fontSize: 13, color: "#718096" }}>번역 데이터 없음</p>
                      ) : (
                        translations.map((t, j) => (
                          <Section
                            key={j}
                            title={`${String(t.language_code)}  ·  AI번역: ${t.is_ai_translated ? "✓" : "✗"}  ·  데이터변경: ${t.isChangedData ? "✓" : "✗"}  ·  번역일: ${t.translated_at ? String(t.translated_at).slice(0, 10) : "—"}`}
                            defaultOpen={j === 0}
                          >
                            <TransTable t={t} fields={MP_TRANS_FIELDS} />
                          </Section>
                        ))
                      )}
                    </Section>
                  </Section>
                );
              })
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
