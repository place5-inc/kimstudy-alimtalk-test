import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function SafetyNumberTab() {
  return (
    <div>
      <p className="page-title">안심번호 발급일 초기화</p>
      <p className="page-subtitle">
        안심번호 재발급 조건은 발급 후 7일 경과입니다.
        이 기능은 발급일을 10일 전으로 되돌려 즉시 재발급 가능한 상태로 만듭니다.
      </p>

      <ActionForm
        title="🔁 안심번호 발급일 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/change/safetyNumber/issueDay"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="account:safetyNumber"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="sn_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="sn_nick"
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
