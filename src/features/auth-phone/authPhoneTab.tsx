import { z } from "zod";
import { ActionForm, requiredText } from "../../shared/ui/ActionForm";

const schema = z.object({ nickname: requiredText });

export function authPhoneTab() {
  return (
    <div>
      <p className="page-title">휴대폰 - 인증번호 (4자리) 확인</p>
      <p className="page-subtitle">
        로그인, 회원가입을 위한 인증번호 4자리를 확인할 수 있어요.
      </p>

      <ActionForm
        title="인증번호 확인"
        buttonLabel="확인"
        variant="send"
        schema={schema}
        backendPath="/api/admin/test/auth/phone"
        buildParams={(v) => ({ phoneNumber: v.phoneNumber })}
        action="authPhone:check"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="ep_phone">
              phoneNumber <span className="required">*</span>
            </label>
            <input
              id="ep_phone"
              type="text"
              placeholder="휴대폰 번호 입력"
              autoComplete="off"
              {...register("phoneNumber")}
            />
          </div>
        )}
      </ActionForm>
    </div>
  );
}
