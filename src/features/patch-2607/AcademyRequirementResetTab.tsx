import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function AcademyRequirementResetTab() {
  return (
    <div>
      <p className="page-title">김강사 채용제안 응답팝업 초기화</p>

      <ActionForm
        title="🔄 김강사 채용제안 응답팝업 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/academyRequirement"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2607:academyRequirementReset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="academy_req_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="academy_req_nickname"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register('nickname')}
            />
          </div>
        )}
      </ActionForm>
    </div>
  );
}
