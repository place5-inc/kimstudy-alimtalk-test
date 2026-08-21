import { z } from "zod";
import { requiredText, ActionForm } from "../../shared/ui/ActionForm";

const schema = z.object({ nickname: requiredText });

export function CurationPopupResetTab() {
  return (
    <div>
      <p className="page-title">특별관 팝업 노출기록 초기화</p>
      <ActionForm
        title="특별관 팝업 노출기록 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/curation/popup"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2608:curationPopupReset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="cp_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="cp_nickname"
              type="text"
              placeholder="닉네임"
              autoComplete="off"
              {...register("nickname")}
            />
            <div className="guide-box guide-box--reset">
              <p className="guide-title">
                해당 유저의 특별관 팝업(curationPopup) 노출 기록을 초기화합니다.
              </p>
            </div>
          </div>
        )}
      </ActionForm>
    </div>
  );
}
