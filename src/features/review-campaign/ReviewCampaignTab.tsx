import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const sendSchema = z.object({ nickname: requiredText });
const resetSchema = z.object({ nickname: requiredText });

export function ReviewCampaignTab() {
  return (
    <div>
      <p className="page-title">후기 확보 캠페인</p>
      <p className="page-subtitle">수업 후기 작성을 유도하는 알림톡을 발송합니다.</p>

      <ActionForm
        title="📤 알림톡 발송"
        buttonLabel="알림톡 발송"
        variant="send"
        schema={sendSchema}
        backendPath="/admin/test/review/test/kakao/resend-missing"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="reviewCampaign:send"
        dangerous
        confirmTitle="알림톡을 발송하시겠습니까?"
        confirmBody="입력한 닉네임의 사용자에게 실제 발송됩니다."
      >
        {({ register }) => (
          <>
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
            <div className="guide-box">
              <p className="guide-title">다음과 같은 조건을 충족해야 알림톡이 발송됩니다.</p>
              <ul className="guide-list">
                <li>수업료 8만원 이상</li>
                <li>수업 유형은 정규 또는 단기 수업</li>
                <li>첫 수업일로부터 최소 2주 지나야 함.</li>
                <li>수업에 후기가 작성되지 않아야 함.</li>
              </ul>
            </div>
          </>
        )}
      </ActionForm>

      <ActionForm
        title="🔄 응답 및 발송 이력 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={resetSchema}
        backendPath="/admin/test/review/test/reset/resend-missing"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="reviewCampaign:reset"
        dangerous={false}
      >
        {({ register }) => (
          <>
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
            <div className="guide-box guide-box--reset">
              <p className="guide-title">발송 이력과 발송시점 이후로 작성된 후기를 삭제합니다.</p>
            </div>
          </>
        )}
      </ActionForm>
    </div>
  );
}
