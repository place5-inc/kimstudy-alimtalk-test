import { z } from 'zod';
import { ActionForm, requiredText, optionalPhone } from '../../shared/ui/ActionForm';

const sendSchema = z.object({
  tutorNickname: requiredText,
  tuteeNickname: requiredText,
});
const resetSchema = z.object({ phoneNumber: optionalPhone });

export function ReviewTab() {
  return (
    <div>
      <p className="page-title">리뷰알림 푸시</p>
      <p className="page-subtitle">고민중인 선생님이 만점 후기를 받았어요</p>

      <ActionForm
        title="📤 리뷰알림 푸시 발송"
        buttonLabel="푸시 발송"
        variant="send"
        schema={sendSchema}
        backendPath="/api/admin/test/push/review"
        buildParams={(v) => ({
          tutorNickname: v.tutorNickname,
          tuteeNickname: v.tuteeNickname,
        })}
        action="review:send"
        dangerous
        confirmTitle="리뷰알림 푸시를 발송하시겠습니까?"
        confirmBody="해당 사용자들에게 실제 발송됩니다."
      >
        {({ register }) => (
          <div className="field">
            <div className="row">
              <div>
                <label htmlFor="rv_tutor">
                  tutorNickname <span className="required">*</span>
                </label>
                <input
                  id="rv_tutor"
                  type="text"
                  placeholder="튜터 닉네임"
                  autoComplete="off"
                  {...register('tutorNickname')}
                />
              </div>
              <div>
                <label htmlFor="rv_tutee">
                  tuteeNickname <span className="required">*</span>
                </label>
                <input
                  id="rv_tutee"
                  type="text"
                  placeholder="학생 닉네임"
                  autoComplete="off"
                  {...register('tuteeNickname')}
                />
              </div>
            </div>
          </div>
        )}
      </ActionForm>

      <ActionForm
        title="🔄 리뷰알림 푸시 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={resetSchema}
        backendPath="/api/admin/test/reset/review/push"
        buildParams={(v) => {
          const out: Record<string, string> = {};
          if (v.phoneNumber) out.phoneNumber = v.phoneNumber;
          return out;
        }}
        action="review:reset"
        dangerous={false}
      >
        {({ register, values, setField }) => (
          <div className="field">
            <label htmlFor="rv_phone">phoneNumber</label>
            <input
              id="rv_phone"
              type="text"
              placeholder="01000000000 (dash 없이)"
              maxLength={11}
              autoComplete="off"
              {...register('phoneNumber')}
              onChange={(e) =>
                setField('phoneNumber', e.target.value.replace(/\D/g, ''))
              }
              value={(values.phoneNumber as string | undefined) ?? ''}
            />
            <p className="hint">입력하지 않으면 전체 초기화</p>
          </div>
        )}
      </ActionForm>
    </div>
  );
}
