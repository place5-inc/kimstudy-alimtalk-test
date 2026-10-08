import { useState, useCallback } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

// ─── 번역 결과 타입 ───────────────────────────────────────────────────────────

interface TranslationField {
  value: string | null;
  ai_value: string | null;
  is_changed: boolean;
}

interface LangTranslation {
  lang: string;
  fields: Record<string, TranslationField>;
}

interface BasicInfoSection {
  is_ai_translated: boolean;
  languages: LangTranslation[];
}

interface TextBookItem {
  textbook_id: number;
  textbook_name: string;
  languages: LangTranslation[];
}

interface SingleSessionPlanFlow {
  label: string | null;
  value: string | null;
  ai_label: string | null;
  ai_value: string | null;
  is_changed_label: boolean;
  is_changed_value: boolean;
}

interface SingleSessionPlan {
  is_ai_translated: boolean;
  original_flows: SingleSessionPlanFlow[];
  languages: Array<{
    lang: string;
    translated_flows: SingleSessionPlanFlow[];
  }>;
}

interface TutorExperience {
  experience_id: number;
  type: number;
  original: string | null;
  ai_value: string | null;
  is_changed: boolean;
}

interface TutorCareer {
  career_id: number;
  title: string | null;
  ment: string | null;
  ai_title: string | null;
  ai_ment: string | null;
  is_changed_title: boolean;
  is_changed_ment: boolean;
  output?: string | null;
  ai_output?: string | null;
  is_changed_output?: boolean;
}

interface ReviewReply {
  reply_id: number;
  comment: string | null;
  ai_comment: string | null;
  is_changed_comment: boolean;
}

interface LessonReview {
  review_id: number;
  comment: string | null;
  ai_comment: string | null;
  is_changed_comment: boolean;
  replies: ReviewReply[];
}

interface TutorTranslationResult {
  nickname: string;
  lesson_tutor_class_information_translation?: BasicInfoSection;
  text_book_translation?: TextBookItem[];
  single_session_plan?: SingleSessionPlan;
  tutor_experience?: TutorExperience[];
  tutor_career?: TutorCareer[];
  lesson_review?: LessonReview[];
}

// ─── 필드 레이블 매핑 ─────────────────────────────────────────────────────────

const BASIC_INFO_FIELDS: Record<string, string> = {
  appeal: "어필 포인트",
  pay_description: "수업료 안내",
  simple_introduction: "한줄 소개",
  online_class_description: "온라인 수업 안내",
  subject_description: "과목 설명",
  differentiation: "차별점",
  mbti_description: "MBTI 상세 설명",
  demo_class_description: "시범수업 안내",
  feedback_cycle: "피드백 주기",
  feedback_method: "피드백 방법",
  homework_assignment_method: "숙제 부여 방식",
  homework_checking: "숙제 검사 방식",
  homework_not_completed: "숙제 미완료 시 대처",
  extra_service_qna: "질의응답",
  extra_service_coaching: "코칭",
  extra_service_consulting: "컨설팅",
  extra_service_etc: "기타 서비스",
  tutor_tip_concern: "선생님 팁 - 학생 고민",
  tutor_tip_study_method: "공부법",
  tutor_tip_result: "성과",
  extra_schedule: "추가 일정 안내",
};

const LANG_LABELS: Record<string, string> = {
  en: "영어(EN)",
  ja: "일본어(JA)",
  zh: "중국어(ZH)",
  vi: "베트남어(VI)",
};

const EXPERIENCE_TYPE_LABELS: Record<number, string> = {
  5: "사용자 정의",
  7: "기타",
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

function FieldRow({ label, original, aiValue, isChanged }: {
  label: string;
  original: string | null;
  aiValue: string | null;
  isChanged: boolean;
}) {
  if (!aiValue && !original) return null;
  return (
    <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #f0f4f8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#4a5568" }}>{label}</span>
        {isChanged && <ChangedBadge />}
      </div>
      {aiValue ? (
        <div style={{ fontSize: 12, color: "#2d3748", background: "#f7fafc", padding: "6px 10px", borderRadius: 6, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {aiValue}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#a0aec0", fontStyle: "italic" }}>미번역</div>
      )}
      {isChanged && original && (
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

// ─── 섹션별 렌더러 ────────────────────────────────────────────────────────────

function BasicInfoView({ data }: { data: BasicInfoSection }) {
  const langs = data.languages.map((l) => l.lang);
  const [selectedLang, setSelectedLang] = useState(langs[0] ?? "en");

  if (!data.is_ai_translated) {
    return <p style={{ fontSize: 12, color: "#a0aec0", fontStyle: "italic" }}>아직 번역되지 않았습니다.</p>;
  }

  const langData = data.languages.find((l) => l.lang === selectedLang);

  return (
    <>
      <LangTab langs={langs} selectedLang={selectedLang} onSelect={setSelectedLang} />
      {langData
        ? Object.entries(BASIC_INFO_FIELDS).map(([key, label]) => {
            const f = langData.fields[key];
            if (!f) return null;
            return <FieldRow key={key} label={label} original={f.value} aiValue={f.ai_value} isChanged={f.is_changed} />;
          })
        : <p style={{ fontSize: 12, color: "#a0aec0" }}>해당 언어 데이터 없음</p>
      }
    </>
  );
}

function TextBookView({ items }: { items: TextBookItem[] }) {
  const [selectedBook, setSelectedBook] = useState(0);
  const [selectedLang, setSelectedLang] = useState("");

  const book = items[selectedBook];
  const langs = book?.languages.map((l) => l.lang) ?? [];
  const activeLang = selectedLang || langs[0] || "";
  const langData = book?.languages.find((l) => l.lang === activeLang);

  if (!items.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>교재 데이터 없음</p>;

  return (
    <>
      {items.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {items.map((b, i) => (
            <button key={b.textbook_id} type="button"
              onClick={() => { setSelectedBook(i); setSelectedLang(""); }}
              style={{
                padding: "3px 10px", borderRadius: 12, fontSize: 11, cursor: "pointer",
                border: selectedBook === i ? "2px solid #805ad5" : "1px solid #e2e8f0",
                background: selectedBook === i ? "#faf5ff" : "#fff",
                color: selectedBook === i ? "#553c9a" : "#4a5568",
              }}>
              {b.textbook_name}
            </button>
          ))}
        </div>
      )}
      <LangTab langs={langs} selectedLang={activeLang} onSelect={setSelectedLang} />
      {langData
        ? Object.entries(langData.fields).map(([key, f]) => (
            <FieldRow key={key} label={key} original={f.value} aiValue={f.ai_value} isChanged={f.is_changed} />
          ))
        : <p style={{ fontSize: 12, color: "#a0aec0" }}>해당 언어 데이터 없음</p>
      }
    </>
  );
}

function SessionPlanView({ data }: { data: SingleSessionPlan }) {
  const langs = data.languages.map((l) => l.lang);
  const [selectedLang, setSelectedLang] = useState(langs[0] ?? "en");

  if (!data.is_ai_translated) {
    return <p style={{ fontSize: 12, color: "#a0aec0", fontStyle: "italic" }}>아직 번역되지 않았습니다.</p>;
  }

  const langData = data.languages.find((l) => l.lang === selectedLang);

  return (
    <>
      <LangTab langs={langs} selectedLang={selectedLang} onSelect={setSelectedLang} />
      {langData
        ? langData.translated_flows.map((flow, i) => (
            <div key={i} style={{ marginBottom: 10, padding: "8px 10px", background: "#f7fafc", borderRadius: 6 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4a5568" }}>
                  {flow.ai_label ?? `단계 ${i + 1}`}
                </span>
                {flow.is_changed_label && <ChangedBadge />}
              </div>
              <p style={{ fontSize: 12, color: "#2d3748", margin: 0, whiteSpace: "pre-wrap" }}>
                {flow.ai_value ?? <span style={{ color: "#a0aec0", fontStyle: "italic" }}>미번역</span>}
              </p>
            </div>
          ))
        : <p style={{ fontSize: 12, color: "#a0aec0" }}>해당 언어 데이터 없음</p>
      }
    </>
  );
}

function ExperienceView({ items }: { items: TutorExperience[] }) {
  if (!items.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>경험 데이터 없음</p>;
  return (
    <>
      {items.map((exp) => (
        <div key={exp.experience_id} style={{ marginBottom: 10, padding: "8px 10px", background: "#f7fafc", borderRadius: 6 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#718096" }}>
              {EXPERIENCE_TYPE_LABELS[exp.type] ?? `타입 ${exp.type}`} (ID: {exp.experience_id})
            </span>
            {exp.is_changed && <ChangedBadge />}
          </div>
          <p style={{ fontSize: 12, color: "#2d3748", margin: 0, whiteSpace: "pre-wrap" }}>
            {exp.ai_value ?? <span style={{ color: "#a0aec0", fontStyle: "italic" }}>미번역</span>}
          </p>
        </div>
      ))}
    </>
  );
}

function CareerView({ items }: { items: TutorCareer[] }) {
  if (!items.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>경력 데이터 없음</p>;
  return (
    <>
      {items.map((c) => (
        <div key={c.career_id} style={{ marginBottom: 12, padding: "10px 12px", background: "#f7fafc", borderRadius: 6 }}>
          <p style={{ fontSize: 11, color: "#718096", margin: "0 0 6px" }}>경력 ID: {c.career_id}</p>
          {(c.ai_title || c.title) && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4a5568" }}>제목</span>
                {c.is_changed_title && <ChangedBadge />}
              </div>
              <p style={{ fontSize: 12, color: "#2d3748", margin: 0, whiteSpace: "pre-wrap" }}>{c.ai_title ?? c.title}</p>
            </div>
          )}
          {(c.ai_ment || c.ment) && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4a5568" }}>멘트</span>
                {c.is_changed_ment && <ChangedBadge />}
              </div>
              <p style={{ fontSize: 12, color: "#2d3748", margin: 0, whiteSpace: "pre-wrap" }}>{c.ai_ment ?? c.ment}</p>
            </div>
          )}
          {(c.ai_output !== undefined || c.output !== undefined) && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4a5568" }}>성과</span>
                {c.is_changed_output && <ChangedBadge />}
              </div>
              <p style={{ fontSize: 12, color: "#2d3748", margin: 0, whiteSpace: "pre-wrap" }}>{c.ai_output ?? c.output ?? "-"}</p>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function ReviewView({ items }: { items: LessonReview[] }) {
  if (!items.length) return <p style={{ fontSize: 12, color: "#a0aec0" }}>후기 데이터 없음</p>;
  return (
    <>
      {items.map((rev) => (
        <div key={rev.review_id} style={{ marginBottom: 12, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: "#f0fff4", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#276749", fontWeight: 700 }}>후기 ID: {rev.review_id}</span>
            {rev.is_changed_comment && <ChangedBadge />}
          </div>
          <div style={{ padding: "8px 12px" }}>
            <p style={{ fontSize: 12, color: "#2d3748", margin: 0, whiteSpace: "pre-wrap" }}>
              {rev.ai_comment ?? <span style={{ color: "#a0aec0", fontStyle: "italic" }}>미번역</span>}
            </p>
          </div>
          {rev.replies.length > 0 && (
            <div style={{ borderTop: "1px solid #e2e8f0", background: "#fafafa" }}>
              {rev.replies.map((reply) => (
                <div key={reply.reply_id} style={{ padding: "6px 12px 6px 24px", borderBottom: "1px solid #f0f4f8" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: "#718096" }}>↳ 답글 {reply.reply_id}</span>
                    {reply.is_changed_comment && <ChangedBadge />}
                  </div>
                  <p style={{ fontSize: 12, color: "#4a5568", margin: 0, whiteSpace: "pre-wrap" }}>
                    {reply.ai_comment ?? <span style={{ color: "#a0aec0", fontStyle: "italic" }}>미번역</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function TranslationResultView({ data }: { data: TutorTranslationResult }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ padding: "8px 14px", background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2b6cb0" }}>{data.nickname}</span>
        <span style={{ fontSize: 12, color: "#4a5568", marginLeft: 8 }}>번역 결과</span>
      </div>

      {data.lesson_tutor_class_information_translation && (
        <SectionCard title="기본소개서 번역">
          <BasicInfoView data={data.lesson_tutor_class_information_translation} />
        </SectionCard>
      )}

      {data.text_book_translation && data.text_book_translation.length > 0 && (
        <SectionCard title={`교재 번역 (${data.text_book_translation.length}권)`}>
          <TextBookView items={data.text_book_translation} />
        </SectionCard>
      )}

      {data.single_session_plan && (
        <SectionCard title="한회차 수업계획 번역">
          <SessionPlanView data={data.single_session_plan} />
        </SectionCard>
      )}

      {data.tutor_experience && data.tutor_experience.length > 0 && (
        <SectionCard title={`선생님 경험 (${data.tutor_experience.length}건)`}>
          <ExperienceView items={data.tutor_experience} />
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
  const [viewData, setViewData]         = useState<TutorTranslationResult | null>(null);

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

        const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null; result?: TutorTranslationResult };
        if (json.isSuccess && json.result) {
          setViewData(json.result);
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
