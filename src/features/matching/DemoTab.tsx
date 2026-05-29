import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const sendSchema = z.object({ nickname: requiredText });
const resetSchema = z.object({ nickname: requiredText });

export function DemoTab() {
  return (
    <div>
      <p className="page-title">시범전환 알림톡</p>
      <p className="page-subtitle">매출향상 프로젝트</p>

      <ActionForm
        title="📤 알림톡 발송"
        badge="demo_change"
        buttonLabel="알림톡 발송"
        variant="send"
        schema={sendSchema}
        backendPath="/admin/test/matching/scheduler"
        buildParams={(v) => ({ type: 'demo_change', nickname: v.nickname })}
        action="matching:send"
        dangerous
        confirmTitle="알림톡을 발송하시겠습니까?"
        confirmBody="입력한 닉네임의 사용자에게 실제 발송됩니다."
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="d_send_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="d_send_nick"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register('nickname')}
            />
          </div>
        )}
      </ActionForm>

      <ActionForm
        title="🔄 응답 및 발송 이력 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={resetSchema}
        backendPath="/admin/test/reset/demo/respond"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="demo:reset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="d_reset_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="d_reset_nick"
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
