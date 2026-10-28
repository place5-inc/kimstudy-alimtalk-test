import { z } from "zod";
import { requiredText, ActionForm } from "../../shared/ui/ActionForm";

const schema = z.object({ nickname: requiredText });

export function SubjectDescriptionResetTab() {
  return (
    <div>
      <p className="page-title">소개서 - 과목별수업내용초기화</p>

      <ActionForm
        title="과목별 수업내용 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/subject/description"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="profile:resetSubjectDescription"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="sdr_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="sdr_nickname"
              type="text"
              placeholder="선생님 닉네임"
              autoComplete="off"
              {...register("nickname")}
            />
          </div>
        )}
      </ActionForm>
    </div>
  );
}
