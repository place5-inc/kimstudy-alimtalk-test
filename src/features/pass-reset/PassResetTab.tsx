import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function PassResetTab() {
  return (
    <div>
      <p className="page-title">PASS 인증 초기화</p>
      <p className="page-subtitle">PASS 인증을 새로 받을 수 있도록 관련 값 리셋</p>

      <ActionForm
        title="🔄 PASS 인증 관련 값 리셋"
        buttonLabel="리셋"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/pass/auth"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="passAuth:reset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="pass_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="pass_nick"
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
