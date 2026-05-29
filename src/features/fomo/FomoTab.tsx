import { z } from 'zod';
import { ActionForm, requiredText, optionalPhone } from '../../shared/ui/ActionForm';

const sendSchema = z.object({
  tutorNickname: requiredText,
  tuteeNickname: requiredText,
});
const resetSchema = z.object({ phoneNumber: optionalPhone });

export function FomoTab() {
  return (
    <div>
      <p className="page-title">FOMO 푸시</p>
      <p className="page-subtitle">고민중인 선생님의 새 수업이 성사됐어요</p>

      <ActionForm
        title="📤 푸시 발송"
        buttonLabel="푸시 발송"
        variant="send"
        schema={sendSchema}
        backendPath="/admin/test/push/fomo"
        buildParams={(v) => ({
          tutorNickname: v.tutorNickname,
          tuteeNickname: v.tuteeNickname,
        })}
        action="fomo:send"
        dangerous
        confirmTitle="FOMO 푸시를 발송하시겠습니까?"
        confirmBody="해당 사용자들에게 실제 발송됩니다."
      >
        {({ register }) => (
          <div className="field">
            <div className="row">
              <div>
                <label htmlFor="fo_tutor">
                  tutorNickname <span className="required">*</span>
                </label>
                <input
                  id="fo_tutor"
                  type="text"
                  placeholder="튜터 닉네임"
                  autoComplete="off"
                  {...register('tutorNickname')}
                />
              </div>
              <div>
                <label htmlFor="fo_tutee">
                  tuteeNickname <span className="required">*</span>
                </label>
                <input
                  id="fo_tutee"
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
        title="🔄 푸시 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={resetSchema}
        backendPath="/admin/test/reset/fomo/push"
        buildParams={(v) => {
          const out: Record<string, string> = {};
          if (v.phoneNumber) out.phoneNumber = v.phoneNumber;
          return out;
        }}
        action="fomo:reset"
        dangerous={false}
      >
        {({ register, values, setField }) => (
          <div className="field">
            <label htmlFor="fo_phone">phoneNumber</label>
            <input
              id="fo_phone"
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
