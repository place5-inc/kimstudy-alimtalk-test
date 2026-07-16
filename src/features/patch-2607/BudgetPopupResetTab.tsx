import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function BudgetPopupResetTab() {
  return (
    <div>
      <p className="page-title">예산상향팝업응답초기화</p>

      <ActionForm
        title="🔄 예산상향 팝업 응답 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/request/add/reset"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="patch2607:budgetPopupReset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="budget_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="budget_nickname"
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
