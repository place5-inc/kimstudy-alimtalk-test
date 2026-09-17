import { z } from "zod";
import { requiredText, ActionForm } from "../../shared/ui/ActionForm";

const schema = z.object({ nickname: requiredText });

interface Props {
  title: string;
  subtitle: string;
  sectionTitle: string;
  backendPath: string;
  action: string;
}

export function OverseasNicknameActionTab({ title, subtitle, sectionTitle, backendPath, action }: Props) {
  return (
    <div>
      <p className="page-title">{title}</p>
      <p className="page-subtitle">{subtitle}</p>
      <ActionForm
        title={sectionTitle}
        buttonLabel="실행"
        variant="reset"
        schema={schema}
        backendPath={backendPath}
        buildParams={(v) => ({ nickname: v.nickname })}
        action={action}
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor={`${action}_nickname`}>
              nickname <span className="required">*</span>
            </label>
            <input
              id={`${action}_nickname`}
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register("nickname")}
            />
          </div>
        )}
      </ActionForm>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div>
      <p className="page-title">{label}</p>
      <div style={{ padding: "3rem 1.5rem", color: "#bbb", fontSize: 14 }}>
        {label} — 준비중입니다
      </div>
    </div>
  );
}

export function OverseasIdentityVerifyTab() {
  return <ComingSoon label="신원인증 완료처리" />;
}

export function OverseasIdentityResetTab() {
  return <ComingSoon label="신원인증 초기화" />;
}

export function OverseasNationalityChangeTab() {
  return <ComingSoon label="국적 변경" />;
}
