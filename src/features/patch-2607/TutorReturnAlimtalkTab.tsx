import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({
  tutorNickname: requiredText,
  requestId: requiredText,
});

export function TutorReturnAlimtalkTab() {
  return (
    <div>
      <p className="page-title">이탈선생님복귀유도알림톡 발송</p>

      <ActionForm
        title="📨 이탈선생님복귀유도알림톡 발송 (bizp_2026061613361439829272240)"
        buttonLabel="발송"
        variant="send"
        schema={schema}
        backendPath="/admin/test/kakao/tutor/reactivation"
        buildParams={(v) => ({
          templateCode: 'bizp_2026061613361439829272240',
          tutorNickname: v.tutorNickname,
          requestId: v.requestId,
        })}
        action="patch2607:tutorReturnAlimtalk"
        dangerous={false}
      >
        {({ register }) => (
          <>
            <div className="field">
              <label htmlFor="tutor_return_nickname">
                선생님 닉네임 <span className="required">*</span>
              </label>
              <input
                id="tutor_return_nickname"
                type="text"
                placeholder="선생님 닉네임 입력"
                autoComplete="off"
                {...register('tutorNickname')}
              />
            </div>
            <div className="field">
              <label htmlFor="tutor_return_requestId">
                모집공고 ID <span className="required">*</span>
              </label>
              <input
                id="tutor_return_requestId"
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
