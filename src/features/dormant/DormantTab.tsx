import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function DormantTab() {
  return (
    <div>
      <p className="page-title">휴면전환</p>
      <p className="page-subtitle">&nbsp;</p>

      <ActionForm
        title="📋 휴면 예정 처리"
        buttonLabel="휴면 예정 처리"
        variant="pending"
        schema={schema}
        backendPath="/admin/test/dormant/pending"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="dormant:pending"
        dangerous
        confirmTitle="휴면 예정으로 처리하시겠습니까?"
        confirmBody="해당 닉네임 사용자의 상태가 변경됩니다."
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="dr_pending_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="dr_pending_nick"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register('nickname')}
            />
          </div>
        )}
      </ActionForm>

      <ActionForm
        title="😴 휴면 처리"
        buttonLabel="휴면 처리"
        variant="done"
        schema={schema}
        backendPath="/admin/test/dormant/done"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="dormant:done"
        dangerous
        confirmTitle="휴면 처리하시겠습니까?"
        confirmBody="해당 닉네임 사용자가 휴면 상태로 변경됩니다."
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="dr_done_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="dr_done_nick"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register('nickname')}
            />
          </div>
        )}
      </ActionForm>

      <ActionForm
        title="🔄 휴면 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/dormant/reset"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="dormant:reset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="dr_reset_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="dr_reset_nick"
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
