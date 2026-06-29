import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ loginId: requiredText });

export function AccountRecoveryTab() {
  return (
    <div>
      <p className="page-title">계정 복구</p>

      <ActionForm
        title="🔓 계정 복구"
        buttonLabel="복구"
        variant="reset"
        schema={schema}
        backendPath="/admin/academy/consulting/revoke/kimacademy/account"
        buildParams={(v) => ({ loginId: v.loginId })}
        action="kimInstructor:accountRecovery"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="recovery_loginId">
              loginId <span className="required">*</span>
            </label>
            <input
              id="recovery_loginId"
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
