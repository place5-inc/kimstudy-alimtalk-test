import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function EngagePopupTab() {
  return (
    <div>
      <p className="page-title">과외구함 팝업 리셋</p>
      <p className="page-subtitle">과외구함 상태 변경 팝업 바로 뜰 수 있도록 관련 값 리셋</p>

      <ActionForm
        title="🔄 팝업 관련 값 리셋"
        buttonLabel="리셋"
        variant="reset"
        schema={schema}
        backendPath="/api/admin/test/reset/engagePopup"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="engagePopup:reset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="ep_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="ep_nick"
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
