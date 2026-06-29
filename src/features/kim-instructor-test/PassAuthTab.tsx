import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ loginId: requiredText });

export function PassAuthTab() {
  return (
    <div>
      <p className="page-title">패스 인증처리</p>

      <ActionForm
        title="✅ 패스 인증처리"
        buttonLabel="처리"
        variant="send"
        schema={schema}
        backendPath="/admin/academy/consulting/accept/kimacademy/pass"
        buildParams={(v) => ({ loginId: v.loginId })}
        action="kimInstructor:passAuth"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="pass_loginId">
              loginId <span className="required">*</span>
            </label>
            <input
              id="pass_loginId"
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
