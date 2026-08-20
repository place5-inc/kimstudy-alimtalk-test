import { z } from "zod";
import { requiredText, ActionForm } from "../../shared/ui/ActionForm";

const applySchema = z.object({
  tuteeNickname: requiredText,
  tutorNickname: requiredText,
});
const resetSchema = z.object({ nickname: requiredText });
const popupResetSchema = z.object({ nickname: requiredText });

export function ChildBonusResetTab() {
  return (
    <div>
      <p className="page-title">자녀 보너스 혜택 관련</p>

      {/* ── 적용 ─────────────────────────────────────────────────────────── */}
      <ActionForm
        title="자녀 보너스 혜택 적용 (꼭 성사등록 후 실행 필요)"
        buttonLabel="적용"
        variant="send"
        schema={applySchema}
        backendPath="/admin/test/set/child/benefit"
        buildParams={(v) => ({
          tuteeNickname: v.tuteeNickname,
          tutorNickname: v.tutorNickname,
        })}
        action="patch2608:childBenefitSet"
        dangerous={false}
      >
        {({ register }) => (
          <>
            <div className="field">
              <label htmlFor="cb_tutee">
                tuteeNickname (학생/학부모) <span className="required">*</span>
              </label>
              <input
                id="cb_tutee"
                type="text"
                placeholder="학생 또는 학부모 닉네임"
                autoComplete="off"
                {...register("tuteeNickname")}
              />
            </div>
            <div className="field">
              <label htmlFor="cb_tutor">
                tutorNickname (선생님) <span className="required">*</span>
              </label>
              <input
                id="cb_tutor"
                type="text"
                placeholder="선생님 닉네임"
                autoComplete="off"
                {...register("tutorNickname")}
              />
              <div className="guide-box guide-box--send">
                <p className="guide-title">
                  해당 학생/학부모와 선생님의 가장 최근 완료 매칭에 자녀 보너스
                  혜택을 적용합니다. 성사등록 처리가 완료된 후 실행해야 합니다.
                </p>
              </div>
            </div>
          </>
        )}
      </ActionForm>

      {/* ── 초기화 ───────────────────────────────────────────────────────── */}
      <ActionForm
        title="자녀 보너스 혜택 대상 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={resetSchema}
        backendPath="/admin/test/reset/child/benefit"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2608:childBenefitReset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="cb_reset_nickname">
              nickname (학생/학부모) <span className="required">*</span>
            </label>
            <input
              id="cb_reset_nickname"
              type="text"
              placeholder="학생 또는 학부모 닉네임"
              autoComplete="off"
              {...register("nickname")}
            />
            <div className="guide-box guide-box--reset">
              <p className="guide-title">
                해당 유저의 자녀 교차 매칭 혜택 이력 및 플래그를 초기화합니다.
              </p>
            </div>
          </div>
        )}
      </ActionForm>

      {/* ── 팝업 노출 이력 초기화 ────────────────────────────────────────── */}
      <ActionForm
        title="'다른 자녀분의 과외도 구하면 페이백 2배' 바텀시트 노출 이력 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={popupResetSchema}
        backendPath="/admin/test/reset/child/popup"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2608:childPopupReset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="cb_popup_nickname">
              nickname (학생/학부모) <span className="required">*</span>
            </label>
            <input
              id="cb_popup_nickname"
              type="text"
              placeholder="학생 또는 학부모 닉네임"
              autoComplete="off"
              {...register("nickname")}
            />
            <div className="guide-box guide-box--reset">
              <p className="guide-title">
                해당 유저의 자녀 보너스 바텀시트 노출 이력을 초기화합니다.
              </p>
            </div>
          </div>
        )}
      </ActionForm>
    </div>
  );
}
