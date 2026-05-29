import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ roomId: requiredText });

export function QuickReplyTab() {
  return (
    <div>
      <p className="page-title">간편답변 초기화</p>
      <p className="page-subtitle">간편하게 답변해보세요 사용 하기 전 상태로 초기화</p>

      <ActionForm
        title="🔄 간편답변 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/lesson/quickReply/reset"
        buildParams={(v) => ({ roomId: v.roomId })}
        action="quickReply:reset"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="qr_room">
              roomId <span className="required">*</span>
            </label>
            <input
              id="qr_room"
              type="text"
              placeholder="roomId 입력"
              autoComplete="off"
              {...register('roomId')}
            />
          </div>
        )}
      </ActionForm>
    </div>
  );
}
