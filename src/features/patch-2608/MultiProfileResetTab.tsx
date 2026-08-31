import { z } from "zod";
import { requiredText, ActionForm } from "../../shared/ui/ActionForm";

const schema = z.object({ nickname: requiredText });

export function MultiProfileResetTab() {
  return (
    <div>
      <p className="page-title">멀티소개서 초기화</p>

      {/* ── 기본소개서 언어별 번역 데이터 삭제 ──────────────────────────── */}
      <ActionForm
        title="기본소개서 언어별 번역 데이터 완전 삭제"
        buttonLabel="삭제"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/translated/classInformation"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2608:resetTranslatedClassInfo"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="mp_trans_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="mp_trans_nickname"
              type="text"
              placeholder="선생님 닉네임"
              autoComplete="off"
              {...register("nickname")}
            />
            <div className="guide-box guide-box--reset">
              <p className="guide-title">
                기본소개서(lesson_tutor_class_information)는 유지하고, 해당 선생님의 기본소개서 언어별 번역 데이터(lesson_tutor_class_information_translation)만 하드 딜리트합니다.
              </p>
            </div>
          </div>
        )}
      </ActionForm>

      {/* ── 멀티소개서 + 언어별 번역 데이터 삭제 ───────────────────────── */}
      <ActionForm
        title="멀티소개서 및 언어별 번역 데이터 완전 삭제"
        buttonLabel="삭제"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/multiProfile"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2608:resetMultiProfile"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="mp_multi_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="mp_multi_nickname"
              type="text"
              placeholder="선생님 닉네임"
              autoComplete="off"
              {...register("nickname")}
            />
            <div className="guide-box guide-box--reset">
              <p className="guide-title">
                해당 선생님의 멀티소개서(lesson_tutor_profile) 전체와 각 멀티소개서에 딸린 언어별 번역 데이터(lesson_tutor_profile_translation)를 모두 하드 딜리트합니다.
              </p>
            </div>
          </div>
        )}
      </ActionForm>
    </div>
  );
}
