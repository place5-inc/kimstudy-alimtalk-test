import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function IncheonPopupResetTab() {
  return (
    <div>
      <p className="page-title">인천팝업 초기화</p>
      <p className="page-subtitle">인천광역시 행정구역(중구, 동구, 서구) 개편관련 팝업 봤음 로그 기록을 초기화합니다.</p>

      <ActionForm
        title="인천팝업 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/incheon"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="popup:incheonReset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="incheon_nickname">
              nickname <span className="required">*</span>
            </label>
            <input
              id="incheon_nickname"
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
