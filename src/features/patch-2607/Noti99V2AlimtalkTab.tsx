import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({
  tutorNickname: requiredText,
  requestId: requiredText,
});

export function Noti99V2AlimtalkTab() {
  return (
    <div>
      <p className="page-title">noti99_v2 알림톡 발송</p>

      <ActionForm
        title="📨 noti99_v2 알림톡 발송"
        buttonLabel="발송"
        variant="send"
        schema={schema}
        backendPath="/admin/test/kakao/tutor/reactivation"
        buildParams={(v) => ({
          templateCode: 'noti99_v2',
          tutorNickname: v.tutorNickname,
          requestId: v.requestId,
        })}
        action="patch2607:noti99V2Alimtalk"
        dangerous={false}
      >
        {({ register }) => (
          <>
            <div className="field">
              <label htmlFor="noti99_nickname">
                선생님 닉네임 <span className="required">*</span>
              </label>
              <input
                id="noti99_nickname"
                type="text"
                placeholder="선생님 닉네임 입력"
                autoComplete="off"
                {...register('tutorNickname')}
              />
            </div>
            <div className="field">
              <label htmlFor="noti99_requestId">
                모집공고 ID <span className="required">*</span>
              </label>
              <input
                id="noti99_requestId"
                type="text"
                placeholder="예) 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                autoComplete="off"
                {...register('requestId')}
              />
              <p className="hint">웹 모집공고 상세 페이지 URL에서 확인할 수 있는 GUID 값입니다.</p>
            </div>
          </>
        )}
      </ActionForm>
    </div>
  );
}
