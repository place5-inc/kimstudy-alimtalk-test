import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ loginId: requiredText });

export function JoinHistoryResetTab() {
  return (
    <div>
      <p className="page-title">가입 이력 해제</p>

      <ActionForm
        title="🔄 가입 이력 해제"
        buttonLabel="해제"
        variant="reset"
        schema={schema}
        backendPath="/admin/academy/consulting/reset/kimacademy/phoneNumber"
        buildParams={(v) => ({ loginId: v.loginId })}
        action="kimInstructor:joinHistoryReset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="join_loginId">
              loginId <span className="required">*</span>
            </label>
            <input
              id="join_loginId"
              type="text"
              placeholder="loginId 입력"
              autoComplete="off"
              {...register('loginId')}
            />
          </div>
        )}
      </ActionForm>
    </div>
  );
}
