import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function PassPredictAlimtalkTab() {
  return (
    <div>
      <p className="page-title">합격예측기 알림톡 발송</p>

      <ActionForm
        title="📨 합격예측기 알림톡 발송 (cons_sp_04_v2)"
        buttonLabel="발송"
        variant="send"
        schema={schema}
        backendPath="/admin/pass-predictor/test/kakao"
        buildParams={(v) => ({ templateCode: 'cons_sp_04_v2', nickname: v.nickname })}
        action="patch2607:passPredictAlimtalk"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="pass_predict_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="pass_predict_nickname"
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
