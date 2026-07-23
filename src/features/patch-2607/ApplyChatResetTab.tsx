import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({
  tutorNickname: requiredText,
  academyLoginId: requiredText,
});

export function ApplyChatResetTab() {
  return (
    <div>
      <p className="page-title">김강사 제안,채팅 초기화</p>
      <p className="page-subtitle" style={{ color: '#e53e3e', fontWeight: 600 }}>
        ⚠️ 주의: 두 계정 사이의 채용제안, 주고받았던 메시지가 모두 초기화됩니다.
      </p>

      <ActionForm
        title="🔄 김강사 제안·채팅 초기화"
        buttonLabel="초기화"
        variant="reset"
        schema={schema}
        backendPath="/admin/test/reset/applyChat"
        buildParams={(v) => ({
          tutorNickname: v.tutorNickname,
          academyLoginId: v.academyLoginId,
        })}
        action="patch2607:applyChatReset"
        dangerous={false}
      >
        {({ register }) => (
          <>
            <div className="field">
              <label htmlFor="apply_chat_tutor">
                선생님 닉네임 <span className="required">*</span>
              </label>
              <input
                id="apply_chat_tutor"
                type="text"
                placeholder="선생님 닉네임 입력"
                autoComplete="off"
                {...register('tutorNickname')}
              />
            </div>
            <div className="field">
              <label htmlFor="apply_chat_academy">
                김강사 로그인 아이디 <span className="required">*</span>
              </label>
              <input
                id="apply_chat_academy"
                type="text"
                placeholder="김강사 loginId 입력"
                autoComplete="off"
                {...register('academyLoginId')}
              />
            </div>
          </>
        )}
      </ActionForm>
    </div>
  );
}
