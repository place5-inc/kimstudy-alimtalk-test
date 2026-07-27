import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function PassPredictorResetTab() {
  return (
    <div>
      <p className="page-title">합격예측기 기록 초기화</p>

      <ActionForm
        title="🔄 합격예측기 기록 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/pass-predictor/data"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2607:passPredictorReset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="pass_predictor_reset_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="pass_predictor_reset_nickname"
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
