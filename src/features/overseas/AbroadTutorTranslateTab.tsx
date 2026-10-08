import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

// ─── 실제 응답 구조 타입 ──────────────────────────────────────────────────────
// 응답 루트에 데이터가 직접 위치 (result 래퍼 없음)
// lesson_tutor_class_information_translation 은 언어별 row 배열
// 각 row: { id, lang, is_ai_translated, ai_<field>, <field>, is_changed_<field>, ... }

type AnyRow = Record<string, unknown>;

interface TextBookEntry {
  text_book: { id: number; book_name: string; book_description?: string | null; is_self_made?: boolean | null };
  translations: AnyRow[];
}

interface SessionFlow {
  id: number;
  order_seq: number;
  running_time: number;
  lesson_description: string | null;
  ai_lesson_description: string | null;
  is_changed_lesson_description: boolean | null;
  is_ai_translated: boolean | null;
  language_code: string | null;
}

interface SessionLangGroup {
  language_code: string | null;
  flows: SessionFlow[];
}

interface SessionPlanEntry {
  plan: { key: number; lesson_time: number };
  languages: SessionLangGroup[];
}

interface ReviewInfo {
  key: number;
  comment: string | null;
  comment_en?: string | null; comment_ja?: string | null; comment_zh?: string | null; comment_vi?: string | null;
}

interface ReviewEntry {
  review: ReviewInfo;
  replies: ReviewInfo[];
}

interface TutorTranslationResponse {
  isSuccess: boolean;
  systemMessage: string | null;
  tutorId?: string;
  lesson_tutor_class_information_translation?: AnyRow[];
  text_book?: TextBookEntry[];
  single_session_plan?: SessionPlanEntry[];
  tutor_experience?: AnyRow[];
  tutor_career?: CareerEntry[];
  lesson_review?: ReviewEntry[];
  [key: string]: unknown;
}

// ─── 필드 레이블 매핑 ─────────────────────────────────────────────────────────

const BASIC_INFO_FIELDS: [string, string][] = [
  ["appeal", "어필 포인트"],
  ["simple_introduction", "한줄 소개"],
  ["pay_description", "수업료 안내"],
  ["subject_description", "과목 설명"],
  ["differentiation", "차별점"],
  ["demo_class_description", "시범수업 안내"],
  ["online_class_description", "온라인 수업 안내"],
  ["mbti_description", "MBTI 상세 설명"],
  ["feedback_cycle", "피드백 주기"],
  ["feedback_method", "피드백 방법"],
  ["homework_assignment_method", "숙제 부여 방식"],
  ["homework_checking", "숙제 검사 방식"],
  ["homework_not_completed", "숙제 미완료 시 대처"],
  ["extra_service_qna", "질의응답"],
  ["extra_service_coaching", "코칭"],
  ["extra_service_consulting", "컨설팅"],
  ["extra_service_etc", "기타 서비스"],
  ["tutor_tip_concern", "선생님 팁 - 학생 고민"],
  ["tutor_tip_study_method", "공부법"],
  ["tutor_tip_result", "성과"],
  ["extra_schedule", "추가 일정 안내"],
];

const LANG_LABELS: Record<string, string> = {
  en: "영어(EN)",
  ja: "일본어(JA)",
  zh: "중국어(ZH)",
  vi: "베트남어(VI)",
};

// ─── UI 컴포넌트 ──────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ background: "#edf2f7", borderBottom: "1px solid #e2e8f0", padding: "8px 14px" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#2d3748" }}>{title}</span>
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function ChangedBadge() {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
      background: "#fefcbf", border: "1px solid #f6e05e", color: "#744210",
    }}>선생님 수정</span>
  );
}

function FieldRow({ label, original, aiValue, isChanged, showOriginal }: {
  label: string;
  original: string | null | undefined;
  aiValue: string | null | undefined;
  isChanged: boolean;
  showOriginal?: boolean;
}) {
  if (!aiValue && !original) return null;
  return (
    <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #f0f4f8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#4a5568" }}>{label}</span>
        {isChanged && <ChangedBadge />}
      </div>
      {showOriginal && original && (
        <div style={{ fontSize: 11, color: "#718096", background: "#fff", border: "1px solid #e2e8f0", padding: "4px 8px", borderRadius: 4, marginBottom: 4, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#a0aec0", marginRight: 4 }}>원본</span>{original}
        </div>
      )}
      {aiValue ? (
        <div style={{ fontSize: 12, color: "#2d3748", background: "#f7fafc", padding: "6px 10px", borderRadius: 6, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {aiValue}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#a0aec0", fontStyle: "italic" }}>미번역</div>
      )}
      {!showOriginal && isChanged && original && (
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "#718096" }}>AI원본: </span>
          <span style={{ fontSize: 11, color: "#718096", fontStyle: "italic" }}>{original}</span>
        </div>
      )}
    </div>
  );
}

function LangTab({ langs, selectedLang, onSelect }: {
  langs: string[];
  selectedLang: string;
  onSelect: (lang: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
      {langs.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onSelect(lang)}
          style={{
            padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: selectedLang === lang ? "2px solid #3182ce" : "1px solid #e2e8f0",
            background: selectedLang === lang ? "#ebf8ff" : "#fff",
            color: selectedLang === lang ? "#2b6cb0" : "#4a5568",
          }}
        >
          {LANG_LABELS[lang] ?? lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── 기본소개서 번역 뷰 ───────────────────────────────────────────────────────
// 각 row: { language_code, is_ai_translated, ai_<field>, <field>, is_changed_<field> }

function BasicInfoView({ rows }: { rows: AnyRow[] }) {
  const langs = rows.map((r) => String(r.language_code ?? "")).filter(Boolean);
  const [selectedLang, setSelectedLang] = useState(langs[0] ?? "");

  if (!rows.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>데이터 없음</p>;

  const row = rows.find((r) => String(r.language_code ?? "") === selectedLang) ?? rows[0];
  const isTranslated = row.is_ai_translated !== false;

  return (
    <>
      {langs.length > 1 && (
        <LangTab langs={langs} selectedLang={selectedLang} onSelect={setSelectedLang} />
      )}
      {!isTranslated ? (
        <p style={{ fontSize: 12, color: "#a0aec0", fontStyle: "italic" }}>아직 번역되지 않았습니다.</p>
      ) : (
        BASIC_INFO_FIELDS.map(([key, label]) => (
          <FieldRow
            key={key}
            label={label}
            original={row[key] as string | null}
            aiValue={row[`ai_${key}`] as string | null}
            isChanged={row[`is_changed_${key}`] === true}
          />
        ))
      )}
    </>
  );
}

// ─── 교재 번역 뷰 ─────────────────────────────────────────────────────────────
// { text_book: { id, book_name, book_description }, translations: [...] }[]

function TextBookView({ items }: { items: TextBookEntry[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedLang, setSelectedLang] = useState("");

  if (!items.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>교재 데이터 없음</p>;

  const item = items[selectedIdx];
  const langs = item.translations.map((t) => String(t.language_code ?? "")).filter(Boolean);
  const activeLang = selectedLang || langs[0] || "";
  const row = item.translations.find((t) => String(t.language_code ?? "") === activeLang) ?? item.translations[0];

  return (
    <>
      {/* 교재 선택 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {items.map((b, i) => (
          <button key={b.text_book.id} type="button"
            onClick={() => { setSelectedIdx(i); setSelectedLang(""); }}
            style={{
              padding: "3px 10px", borderRadius: 12, fontSize: 11, cursor: "pointer",
              border: selectedIdx === i ? "2px solid #805ad5" : "1px solid #e2e8f0",
              background: selectedIdx === i ? "#faf5ff" : "#fff",
              color: selectedIdx === i ? "#553c9a" : "#4a5568",
              display: "flex", alignItems: "center", gap: 4,
            }}>
            {b.text_book.book_name}
            {b.text_book.is_self_made && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6, background: "#fefcbf", border: "1px solid #f6e05e", color: "#744210" }}>자체교재</span>
            )}
          </button>
        ))}
      </div>

      {/* 언어 탭 */}
      <LangTab langs={langs} selectedLang={activeLang} onSelect={setSelectedLang} />

      {row ? (
        <>
          <FieldRow label="교재명" original={row.book_name as string} aiValue={row.ai_book_name as string} isChanged={row.is_changed_book_name === true} showOriginal />
          <FieldRow label="교재 설명" original={row.book_description as string} aiValue={row.ai_book_description as string} isChanged={row.is_changed_book_description === true} showOriginal />
        </>
      ) : (
        <p style={{ fontSize: 12, color: "#a0aec0" }}>해당 언어 번역 없음</p>
      )}
    </>
  );
}

// ─── 한회차 수업계획 뷰 ───────────────────────────────────────────────────────

function SessionPlanView({ items }: { items: SessionPlanEntry[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedLang, setSelectedLang] = useState("en");

  if (!items.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>데이터 없음</p>;

  const item = items[selectedIdx];
  const originalGroup = item.languages.find((l) => l.language_code === null);
  const translatedLangs = item.languages
    .filter((l) => l.language_code !== null)
    .map((l) => l.language_code as string);
  const activeLang = selectedLang || translatedLangs[0] || "";
  const translatedGroup = item.languages.find((l) => l.language_code === activeLang);

  return (
    <>
      {items.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {items.map((p, i) => (
            <button key={p.plan.key} type="button"
              onClick={() => { setSelectedIdx(i); }}
              style={{
                padding: "3px 10px", borderRadius: 12, fontSize: 11, cursor: "pointer",
                border: selectedIdx === i ? "2px solid #3182ce" : "1px solid #e2e8f0",
                background: selectedIdx === i ? "#ebf8ff" : "#fff",
                color: selectedIdx === i ? "#2b6cb0" : "#4a5568",
              }}>
              수업계획 #{p.plan.key} ({p.plan.lesson_time}분)
            </button>
          ))}
        </div>
      )}

      <LangTab langs={translatedLangs} selectedLang={activeLang} onSelect={setSelectedLang} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {/* 원본 */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#718096", margin: "0 0 6px" }}>원본 (한국어)</p>
          {(originalGroup?.flows ?? []).map((flow) => (
            <div key={flow.id} style={{ marginBottom: 6, padding: "6px 10px", background: "#f7fafc", borderRadius: 6 }}>
              <span style={{ fontSize: 10, color: "#a0aec0" }}>{flow.order_seq}. {flow.running_time}분</span>
              <p style={{ fontSize: 12, color: "#2d3748", margin: "2px 0 0" }}>{flow.lesson_description ?? "-"}</p>
            </div>
          ))}
        </div>
        {/* 번역 */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#718096", margin: "0 0 6px" }}>번역</p>
          {(translatedGroup?.flows ?? []).map((flow) => (
            <div key={flow.id} style={{ marginBottom: 6, padding: "6px 10px", background: "#f0fff4", borderRadius: 6 }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#a0aec0" }}>{flow.order_seq}. {flow.running_time}분</span>
                {flow.is_changed_lesson_description === true && <ChangedBadge />}
              </div>
              <p style={{ fontSize: 12, color: "#2d3748", margin: "2px 0 0" }}>
                {flow.ai_lesson_description ?? <span style={{ color: "#a0aec0", fontStyle: "italic" }}>미번역</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── 선생님 경험 뷰 ───────────────────────────────────────────────────────────
// type 7: etc_title_*, etc_description_*  /  type 5: user_custom_define_*

interface ExperienceEntry {
  key: number;
  tutor_experience_type_id: number;
  etc_title?: string | null;
  etc_title_en?: string | null;
  etc_title_ja?: string | null;
  etc_title_zh?: string | null;
  etc_title_vi?: string | null;
  etc_description?: string | null;
  etc_description_en?: string | null;
  etc_description_ja?: string | null;
  etc_description_zh?: string | null;
  etc_description_vi?: string | null;
  user_custom_define?: string | null;
  user_custom_define_en?: string | null;
  user_custom_define_ja?: string | null;
  user_custom_define_zh?: string | null;
  user_custom_define_vi?: string | null;
  language_grade?: string | null;
}

const EXP_LANG_SUFFIX: Record<string, string> = { en: "_en", ja: "_ja", zh: "_zh", vi: "_vi" };

function ExperienceView({ items }: { items: ExperienceEntry[] }) {
  const [selectedLang, setSelectedLang] = useState("en");

  if (!items.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>데이터 없음</p>;

  const suffix = EXP_LANG_SUFFIX[selectedLang] ?? "_en";

  return (
    <>
      <LangTab langs={["en", "ja", "zh", "vi"]} selectedLang={selectedLang} onSelect={setSelectedLang} />
      {items.map((exp) => {
        const isType7 = exp.tutor_experience_type_id === 7;
        const isType5 = exp.tutor_experience_type_id === 5;
        return (
          <div key={exp.key} style={{ marginBottom: 10, padding: "10px 12px", background: "#f7fafc", borderRadius: 6 }}>
            <p style={{ fontSize: 11, color: "#718096", margin: "0 0 6px" }}>
              {isType7 ? "기타 경험" : isType5 ? "사용자 정의" : `타입 ${exp.tutor_experience_type_id}`} (key: {exp.key})
            </p>
            {isType7 && (
              <>
                <FieldRow label="제목" original={exp.etc_title ?? null} aiValue={(exp[`etc_title${suffix}` as keyof ExperienceEntry] as string) ?? null} isChanged={false} showOriginal />
                <FieldRow label="설명" original={exp.etc_description ?? null} aiValue={(exp[`etc_description${suffix}` as keyof ExperienceEntry] as string) ?? null} isChanged={false} showOriginal />
              </>
            )}
            {isType5 && (
              <FieldRow label="사용자 정의" original={exp.user_custom_define ?? null} aiValue={(exp[`user_custom_define${suffix}` as keyof ExperienceEntry] as string) ?? null} isChanged={false} showOriginal />
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── 선생님 경력 뷰 ───────────────────────────────────────────────────────────
// { career: { id, career_type, title, title_en/ja/zh/vi, ment, ment_en/... },
//   outputs: [{ id, description, description_en/..., title, title_en/... }] }[]

interface CareerOutput {
  id: number;
  title?: string | null;
  title_en?: string | null; title_ja?: string | null; title_zh?: string | null; title_vi?: string | null;
  description?: string | null;
  description_en?: string | null; description_ja?: string | null; description_zh?: string | null; description_vi?: string | null;
}

interface CareerInfo {
  id: number;
  career_type: string;
  title?: string | null;
  title_en?: string | null; title_ja?: string | null; title_zh?: string | null; title_vi?: string | null;
  ment?: string | null;
  ment_en?: string | null; ment_ja?: string | null; ment_zh?: string | null; ment_vi?: string | null;
}

interface CareerEntry {
  career: CareerInfo;
  outputs: CareerOutput[];
}

const CAREER_TYPE_LABELS: Record<string, string> = {
  internal: "과외 경력", external: "외부 경력", instructor: "강사 경력",
  assistant: "조교 경력", etc: "기타 경력",
};

const CAREER_LANG_SUFFIX: Record<string, string> = { en: "_en", ja: "_ja", zh: "_zh", vi: "_vi" };

function CareerView({ items }: { items: CareerEntry[] }) {
  const [selectedLang, setSelectedLang] = useState("en");
  const suffix = CAREER_LANG_SUFFIX[selectedLang] ?? "_en";

  if (!items.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>경력 데이터 없음</p>;

  return (
    <>
      <LangTab langs={["en", "ja", "zh", "vi"]} selectedLang={selectedLang} onSelect={setSelectedLang} />
      {items.map(({ career, outputs }) => {
        const titleKo = career.title;
        const titleTr = career[`title${suffix}` as keyof CareerInfo] as string | null | undefined;
        const mentKo = career.ment;
        const mentTr = career[`ment${suffix}` as keyof CareerInfo] as string | null | undefined;
        const hasContent = titleTr || mentTr || outputs.some((o) =>
          o[`description${suffix}` as keyof CareerOutput] || o[`title${suffix}` as keyof CareerOutput]
        );
        if (!hasContent && !titleKo && !mentKo) return null;
        return (
          <div key={career.id} style={{ marginBottom: 12, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ background: "#f7fafc", padding: "6px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4a5568" }}>
                {CAREER_TYPE_LABELS[career.career_type] ?? career.career_type} (ID: {career.id})
              </span>
            </div>
            <div style={{ padding: "8px 12px" }}>
              {(titleKo || titleTr) && (
                <FieldRow label="제목" original={titleKo ?? null} aiValue={titleTr ?? null} isChanged={false} />
              )}
              {(mentKo || mentTr) && (
                <FieldRow label="멘트" original={mentKo ?? null} aiValue={mentTr ?? null} isChanged={false} />
              )}
              {outputs.map((o) => {
                const descKo = o.description;
                const descTr = o[`description${suffix}` as keyof CareerOutput] as string | null | undefined;
                const outTitleTr = o[`title${suffix}` as keyof CareerOutput] as string | null | undefined;
                if (!descTr && !outTitleTr && !descKo) return null;
                return (
                  <div key={o.id} style={{ marginTop: 4, padding: "6px 10px", background: "#f0fff4", borderRadius: 6 }}>
                    <p style={{ fontSize: 10, color: "#718096", margin: "0 0 2px" }}>성과 #{o.id}</p>
                    {(outTitleTr || o.title) && (
                      <FieldRow label="성과 제목" original={o.title ?? null} aiValue={outTitleTr ?? null} isChanged={false} showOriginal />
                    )}
                    {(descKo || descTr) && (
                      <FieldRow label="설명" original={descKo ?? null} aiValue={descTr ?? null} isChanged={false} showOriginal />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ─── 후기 번역 뷰 ────────────────────────────────────────────────────────────
// { review: { key, comment, comment_en/ja/zh/vi }, replies: [{ key, comment, ... }] }[]

const REVIEW_LANG_SUFFIX: Record<string, string> = { en: "_en", ja: "_ja", zh: "_zh", vi: "_vi" };

function ReviewView({ items }: { items: ReviewEntry[] }) {
  const [selectedLang, setSelectedLang] = useState("en");
  const suffix = REVIEW_LANG_SUFFIX[selectedLang] ?? "_en";

  if (!items.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>후기 데이터 없음</p>;

  return (
    <>
      <LangTab langs={["en", "ja", "zh", "vi"]} selectedLang={selectedLang} onSelect={setSelectedLang} />
      {items.map(({ review, replies }) => {
        const translated = review[`comment${suffix}` as keyof ReviewInfo] as string | null | undefined;
        return (
          <div key={review.key} style={{ marginBottom: 10, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
            {/* 후기 헤더 */}
            <div style={{ background: "#f0fff4", padding: "6px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, color: "#276749", fontWeight: 700 }}>후기 #{review.key}</span>
            </div>
            {/* 한국어 원본 */}
            <div style={{ padding: "8px 12px", borderBottom: "1px dashed #e2e8f0", background: "#fafafa" }}>
              <p style={{ fontSize: 10, color: "#a0aec0", margin: "0 0 2px" }}>원본</p>
              <p style={{ fontSize: 12, color: "#4a5568", margin: 0, whiteSpace: "pre-wrap" }}>{review.comment ?? "-"}</p>
            </div>
            {/* 번역 */}
            <div style={{ padding: "8px 12px" }}>
              <p style={{ fontSize: 10, color: "#a0aec0", margin: "0 0 2px" }}>번역</p>
              <p style={{ fontSize: 12, color: "#2d3748", margin: 0, whiteSpace: "pre-wrap" }}>
                {translated ?? <span style={{ color: "#a0aec0", fontStyle: "italic" }}>미번역</span>}
              </p>
            </div>
            {/* 답글 */}
            {replies.length > 0 && (
              <div style={{ borderTop: "1px solid #e2e8f0" }}>
                {replies.map((reply) => {
                  const replyTr = reply[`comment${suffix}` as keyof ReviewInfo] as string | null | undefined;
                  return (
                    <div key={reply.key} style={{ padding: "6px 12px 6px 24px", borderBottom: "1px solid #f0f4f8", background: "#fafafa" }}>
                      <p style={{ fontSize: 10, color: "#718096", margin: "0 0 2px" }}>↳ 답글 #{reply.key}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <p style={{ fontSize: 11, color: "#718096", margin: 0, whiteSpace: "pre-wrap" }}>{reply.comment ?? "-"}</p>
                        <p style={{ fontSize: 11, color: "#2d3748", margin: 0, whiteSpace: "pre-wrap" }}>
                          {replyTr ?? <span style={{ color: "#a0aec0", fontStyle: "italic" }}>미번역</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── 전체 결과 뷰 ─────────────────────────────────────────────────────────────

function TranslationResultView({ data }: { data: TutorTranslationResponse }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ padding: "8px 14px", background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2b6cb0" }}>tutor: {data.tutorId ?? "—"}</span>
      </div>

      {data.lesson_tutor_class_information_translation && data.lesson_tutor_class_information_translation.length > 0 && (
        <SectionCard title={`기본소개서 번역 (${data.lesson_tutor_class_information_translation.length}개 언어)`}>
          <BasicInfoView rows={data.lesson_tutor_class_information_translation} />
        </SectionCard>
      )}

      {data.text_book && data.text_book.length > 0 && (
        <SectionCard title={`교재 번역 (${data.text_book.length}권)`}>
          <TextBookView items={data.text_book} />
        </SectionCard>
      )}

      {data.single_session_plan && data.single_session_plan.length > 0 && (
        <SectionCard title={`한회차 수업계획 (${data.single_session_plan.length}건)`}>
          <SessionPlanView items={data.single_session_plan} />
        </SectionCard>
      )}

      {data.tutor_experience && data.tutor_experience.length > 0 && (
        <SectionCard title={`선생님 경험 (${data.tutor_experience.length}건)`}>
          <ExperienceView items={data.tutor_experience as unknown as ExperienceEntry[]} />
        </SectionCard>
      )}

      {data.tutor_career && data.tutor_career.length > 0 && (
        <SectionCard title={`선생님 경력·성과 (${data.tutor_career.length}건)`}>
          <CareerView items={data.tutor_career} />
        </SectionCard>
      )}

      {data.lesson_review && data.lesson_review.length > 0 && (
        <SectionCard title={`후기 번역 (${data.lesson_review.length}건)`}>
          <ReviewView items={data.lesson_review} />
        </SectionCard>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function AbroadTutorTranslateTab() {
  const [translateNickname, setTranslateNickname] = useState("");
  const [translateBusy, setTranslateBusy]         = useState(false);
  const [translateResult, setTranslateResult]     = useState<ResultState | null>(null);

  const [resetNickname, setResetNickname] = useState("");
  const [resetBusy, setResetBusy]         = useState(false);
  const [resetResult, setResetResult]     = useState<ResultState | null>(null);

  const [viewNickname, setViewNickname] = useState("");
  const [viewBusy, setViewBusy]         = useState(false);
  const [viewError, setViewError]       = useState<string | null>(null);
  const [viewData, setViewData]         = useState<TutorTranslationResponse | null>(null);

  const { logout } = useAuth();
  const { env }    = useEnv();

  const handleTranslate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!translateNickname.trim()) { setTranslateResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      setTranslateBusy(true);
      setTranslateResult(null);
      try {
        const r = await callProxy("/admin/test/abroad/translate/nickname", {
          nickname: translateNickname.trim(),
        }, { env });

        if (!r.body.trim()) { setTranslateResult({ ok: false, message: `빈 응답 (${r.status})` }); return; }
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          setTranslateResult({ ok: true, message: json.systemMessage ?? "번역이 진행중입니다." });
        } else {
          setTranslateResult({ ok: false, message: json.systemMessage ?? `실패 (${r.status})` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setTranslateResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setTranslateBusy(false);
      }
    },
    [translateNickname, env, logout],
  );

  const handleReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetNickname.trim()) { setResetResult({ ok: false, message: "닉네임을 입력해주세요." }); return; }

      setResetBusy(true);
      setResetResult(null);
      try {
        const r = await callProxy("/admin/test/abroad/translate/reset", {
          nickname: resetNickname.trim(),
          includePre: "true",
        }, { env });

        if (!r.body.trim()) { setResetResult({ ok: false, message: `빈 응답 (${r.status})` }); return; }
        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
        if (r.ok && json.isSuccess) {
          setResetResult({ ok: true, message: json.systemMessage ?? "번역 초기화 완료" });
        } else {
          setResetResult({ ok: false, message: json.systemMessage ?? `실패 (${r.status})` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setResetResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setResetBusy(false);
      }
    },
    [resetNickname, env, logout],
  );

  const handleView = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!viewNickname.trim()) { setViewError("닉네임을 입력해주세요."); return; }

      setViewBusy(true);
      setViewError(null);
      setViewData(null);
      try {
        const r = await callProxy("/admin/test/abroad/get/tutor/translation", {
          nickname: viewNickname.trim(),
        }, { env });

        if (!r.ok) { setViewError(`실패 (${r.status}) ${r.body}`); return; }
        if (!r.body.trim()) { setViewError(`빈 응답 (${r.status})`); return; }

        const json = JSON.parse(r.body) as TutorTranslationResponse;
        if (json.isSuccess) {
          setViewData(json);
        } else {
          setViewError(json.systemMessage ?? "조회 실패");
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setViewError(`오류: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setViewBusy(false);
      }
    },
    [viewNickname, env, logout],
  );

  return (
    <div>
      <p className="page-title">소개서 번역</p>
      <p className="page-subtitle">선생님의 소개서 정보를 다국어로 번역하거나 번역 데이터를 초기화합니다.</p>

      <form className="section" onSubmit={(e) => void handleTranslate(e)} noValidate>
        <p className="section-title">소개서 번역 실행</p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#718096" }}>
          번역은 백그라운드에서 진행되며 즉시 완료되지 않을 수 있습니다.
        </p>

        <div className="field">
          <label htmlFor="att_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="att_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={translateNickname}
            onChange={(e) => setTranslateNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={translateBusy}>
          {translateBusy ? "요청 중..." : "번역 실행"}
        </button>

        <ResultBox result={translateResult} />
      </form>

      <form className="section" onSubmit={(e) => void handleView(e)} noValidate>
        <p className="section-title">번역 결과 조회</p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#718096" }}>
          번역된 소개서 내용 전체를 언어별로 확인합니다. 🟡 표시는 선생님이 AI번역 내용을 수정한 항목입니다.
        </p>

        <div className="field">
          <label htmlFor="atv_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="atv_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={viewNickname}
            onChange={(e) => setViewNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-send" disabled={viewBusy}>
          {viewBusy ? "조회 중..." : "결과 조회"}
        </button>

        {viewError && (
          <div className="result-box result-error" role="status" aria-live="polite">{viewError}</div>
        )}
      </form>

      {viewData && <TranslationResultView data={viewData} />}

      <form className="section" onSubmit={(e) => void handleReset(e)} noValidate>
        <p className="section-title">소개서 번역 초기화</p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#718096" }}>
          해당 닉네임의 번역 데이터를 초기화합니다. <code>includePre=true</code>로 호출되며 사전 번역 데이터도 함께 삭제됩니다.
        </p>

        <div className="field">
          <label htmlFor="atr_nickname">
            nickname <span className="required">*</span>
          </label>
          <input
            id="atr_nickname"
            type="text"
            placeholder="닉네임 입력"
            autoComplete="off"
            value={resetNickname}
            onChange={(e) => setResetNickname(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-reset" disabled={resetBusy}>
          {resetBusy ? "처리 중..." : "번역 초기화"}
        </button>

        <ResultBox result={resetResult} />
      </form>
    </div>
  );
}
