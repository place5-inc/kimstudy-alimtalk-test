import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function PassPredictorCouponTab() {
  return (
    <div>
      <p className="page-title">합격예측기 쿠폰 추가</p>

      <ActionForm
        title="🎟️ 합격예측기 쿠폰 추가"
        buttonLabel="쿠폰(초대) 추가"
        variant="send"
        schema={schema}
        backendPath="/admin/pass-predictor/add/coupon"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2607:passPredictorCoupon"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="pass_predictor_coupon_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="pass_predictor_coupon_nickname"
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
