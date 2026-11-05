import { z } from "zod";
import { requiredText, ActionForm } from "../../shared/ui/ActionForm";

export function OverseasIdentityVerifyTab() {
  return (
    <div>
      <p className="page-title">신원인증</p>
      <p className="page-subtitle">해외 사용자의 신원인증을 초기화 처리합니다.</p>

      {/* 신원인증 초기화 */}
      <div className="section">
        <ActionForm
          title="신원인증 초기화"
          buttonLabel="초기화"
          variant="reset"
          schema={z.object({ nickname: requiredText })}
          backendPath="/admin/test/abroad/auth/reset"
          buildParams={(v) => ({ nickname: v.nickname })}
          action="abroad:authReset"
          dangerous={false}
        >
          {({ register }) => (
            <div className="field">
              <label htmlFor="reset_nickname">
                nickname <span className="required">*</span>
              </label>
              <input
                id="reset_nickname"
                type="text"
                placeholder="닉네임 입력"
                autoComplete="off"
                {...register("nickname")}
              />
            </div>
          )}
        </ActionForm>
      </div>
    </div>
  );
}
