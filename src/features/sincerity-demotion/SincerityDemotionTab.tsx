import { z } from "zod";
import { ActionForm, requiredText } from "../../shared/ui/ActionForm";

const nicknameSchema = z.object({ nickname: requiredText });
const phoneSchema = z.object({ phoneNumber: requiredText });

export function SincerityDemotionTab() {
  return (
    <div>
      <p className="page-title">성실등급강등 관련</p>

      <ActionForm
        title="1. 성실등급강등 상태 확인"
        buttonLabel="확인"
        variant="done"
        schema={nicknameSchema}
        backendPath="/admin/test/check/degradeBlack"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="sincerityDemotion:check"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="sd_check_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="sd_check_nick"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register("nickname")}
            />
            <div className="guide-box guide-box--reset">
              <p className="guide-title">
                성실등급강등 상태인지 확인만 가능합니다. 강등 처리와 해제는 2~4
                항목을 이용해주세요.
              </p>
            </div>
          </div>
        )}
      </ActionForm>

      <ActionForm
        title="2. 성실등급강등 처리"
        buttonLabel="처리"
        variant="pending"
        schema={nicknameSchema}
        backendPath="/admin/test/set/degradeBlack/nickname"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="sincerityDemotion:set"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="sd_set_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="sd_set_nick"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register("nickname")}
            />
          </div>
        )}
      </ActionForm>

      <ActionForm
        title="3. 성실등급강등 해제"
        buttonLabel="해제"
        variant="reset"
        schema={nicknameSchema}
        backendPath="/admin/test/clear/degradeBlack/nickname"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="sincerityDemotion:clearByNick"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="sd_clear_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="sd_clear_nick"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register("nickname")}
            />
          </div>
        )}
      </ActionForm>

      <ActionForm
        title="4. 성실등급강등 일괄해제"
        buttonLabel="일괄해제"
        variant="reset"
        schema={phoneSchema}
        backendPath="/admin/test/clear/degradeBlack/phone"
        buildParams={(v) => ({ phoneNumber: v.phoneNumber.replace(/-/g, "") })}
        action="sincerityDemotion:clearByPhone"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="sd_clear_phone">
              phoneNumber <span className="required">*</span>
            </label>
            <input
              id="sd_clear_phone"
              type="text"
              placeholder="휴대폰 번호 입력 (예: 01012345678, 010-1234-5678)"
              autoComplete="off"
              {...register("phoneNumber")}
            />
            <div className="guide-box guide-box--reset">
              <p className="guide-title">
                휴대폰 번호로 만들어진 모든 계정의 성실등급강등 상태를
                해제합니다.
              </p>
            </div>
          </div>
        )}
      </ActionForm>
      <ActionForm
        title="5. 학부모 - 성실등급강등되지 않는 나이로 세팅"
        buttonLabel="세팅"
        variant="pending"
        schema={nicknameSchema}
        backendPath="/admin/test/update/age/antiDegradeBlack"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="sincerityDemotion:setParentAge"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="sd_parent_age_nick">
              nickname <span className="required">*</span>
            </label>
            <input
              id="sd_parent_age_nick"
              type="text"
              placeholder="닉네임 입력"
              autoComplete="off"
              {...register("nickname")}
            />
            <div className="guide-box guide-box--reset">
              <p className="guide-title">실행 전 확인사항</p>
              <ul className="guide-list">
                <li><b>학부모</b> 계정 유형만 세팅 가능합니다.</li>
                <li>성별 정보가 있어야 합니다. (남성 만 46세, 여성 만 44세 기준으로 생년월일 변경)</li>
                <li>신원인증이 먼저 승인처리 되어 있어야 합니다.</li>
                <li>이미 성실등급강등 상태인 경우, 자동으로 강등 해제 후 나이 세팅됩니다.</li>
              </ul>
            </div>
          </div>
        )}
      </ActionForm>
    </div>
  );
}
