import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function PassPredictorUpdateDayTab() {
  return (
    <div>
      <p className="page-title">합격예측기 - 정보 수정일 100일전으로 변경</p>

      <ActionForm
        title="📅 정보 수정일 100일전으로 변경"
        buttonLabel="변경"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/update/pass-predictor/updateDay"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2607:passPredictorUpdateDay"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="pass_predictor_update_day_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="pass_predictor_update_day_nickname"
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
