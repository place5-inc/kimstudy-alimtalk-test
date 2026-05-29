import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function RecoveryTab() {
  return (
    <div>
      <p className="page-title">이탈복구 푸시</p>
      <p className="page-subtitle">작성하시던 공고를 완성해주세요!</p>

      <ActionForm
        title="📤 이탈복구 푸시 발송"
        buttonLabel="푸시 발송"
        variant="send"
        schema={schema}
        backendPath="/admin/test/push/recovery"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="recovery:send"
        dangerous
        confirmTitle="이탈복구 푸시를 발송하시겠습니까?"
        confirmBody="해당 닉네임 사용자에게 실제 발송됩니다."
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="rc_send_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="rc_send_nick"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register('nickname')}
            />
          </div>
        )}
      </ActionForm>

      <ActionForm
        title="🔄 이탈 기록 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/recovery"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="recovery:reset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="rc_reset_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="rc_reset_nick"
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
