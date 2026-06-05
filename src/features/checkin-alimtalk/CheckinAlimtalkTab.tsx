import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const TEMPLATE_CODES = [
  'bizp_2026051408411525081660576',
  'bizp_2026051408443925081242634',
  'bizp_2026051408472019603135159',
  'bizp_2026051408482019603468773',
  'bizp_2026051408493719603670986',
  'bizp_2026051408504019603465109',
  'bizp_2026051408524619603686338',
  'bizp_2026051408550525081933775',
  'bizp_2026051409000319603898521',
  'bizp_2026051409012325081752934',
  'bizp_2026051409055519603300605',
];

const PARENT_CODES = new Set([
  'bizp_2026051408411525081660576',
  'bizp_2026051408443925081242634',
  'bizp_2026051408472019603135159',
  'bizp_2026051408482019603468773',
  'bizp_2026051408493719603670986',
  'bizp_2026051408504019603465109',
]);

const TUTOR_CODES = new Set([
  'bizp_2026051408524619603686338',
  'bizp_2026051408550525081933775',
  'bizp_2026051409000319603898521',
  'bizp_2026051409012325081752934',
  'bizp_2026051409055519603300605',
]);

function getNicknameLabel(templateCode: string): string {
  if (PARENT_CODES.has(templateCode)) return '학부모 닉네임';
  if (TUTOR_CODES.has(templateCode)) return '선생님 닉네임';
  return '알림톡 수신받을 계정의 닉네임';
}

interface TemplatePreview {
  body: string;
  buttons: string[];
}

const TEMPLATE_PREVIEWS: Record<string, TemplatePreview> = {
  'bizp_2026051408411525081660576': {
    body: '[첫 수업은 어떠셨나요?]\n\n안녕하세요 #{닉네임} 회원님!\n\n#{선생님닉네임} 선생님과의 첫 수업은 어떠셨나요?\n\n회원님이 직접 말씀하시기 어려운 부분이 있다면 김과외가 따뜻한 편지로 다듬어 선생님께 부드럽게 전해드릴게요. 칭찬을 남겨주셔도 좋아요!\n\n아래 버튼을 눌러 어떤 식으로 전달되는지 확인 후, 지금 바로 남겨보세요! (평균 15초 소요)',
    buttons: ['남겨보기'],
  },
  'bizp_2026051408443925081242634': {
    body: '안녕하세요 #{닉네임} 회원님!\n\n김과외에서 구하신 과외수업, 잘 진행하고 계신가요~?\n\n만약 수업중, 회원님이 직접 말씀하시기 어려운 부분이 있다면 앞으로 김과외가 따뜻한 편지로 다듬어 선생님께 부드럽게 전해드리고자 합니다. 칭찬을 남겨주셔도 좋아요!\n\n아래 버튼을 눌러 어떤 식으로 전달되는지 확인 후, 지금 바로 남겨보세요! (평균 15초 소요)',
    buttons: ['남겨보기'],
  },
  'bizp_2026051408472019603135159': {
    body: '[최근 수업은 어떠셨나요?]\n\n안녕하세요 #{닉네임} 회원님, #{선생님닉네임} (#{수업과목}) 선생님과의 최근 수업은 어떠셨는지 아래 버튼을 눌러 가볍게 말씀해주실 수 있을까요?\n\n📬 선생님께서 회원님께 전달하신 내용도 도착해 있어요!\n\n편하신 시간에 남겨주시면 감사하겠습니다 🙏',
    buttons: ['최근 수업 근황 알리기', '수업을 진행하지 않았어요'],
  },
  'bizp_2026051408493719603670986': {
    body: '[최근 수업은 어떠셨나요?]\n\n안녕하세요 #{닉네임} 회원님, 현재 #{선생님수}명의 선생님들과 수업을 진행 중이시네요. 최근 수업은 어떠셨는지 아래 버튼을 눌러 가볍게 말씀해주실 수 있을까요?\n\n📬 선생님께서 회원님께 전달하신 내용도 도착해 있어요!\n\n편하신 시간에 남겨주시면 감사하겠습니다 🙏',
    buttons: ['최근 수업 근황 알리기', '수업을 진행하지 않았어요'],
  },
  'bizp_2026051408482019603468773': {
    body: '[최근 수업은 어떠셨나요?]\n\n안녕하세요 #{닉네임} 회원님, #{선생님닉네임} (#{수업과목}) 선생님과의 최근 수업은 어떠셨는지 아래 버튼을 눌러 가볍게 말씀해주실 수 있을까요?\n\n편하신 시간에 남겨주시면 감사하겠습니다 🙏',
    buttons: ['최근 수업 근황 알리기', '수업을 진행하지 않았어요'],
  },
  'bizp_2026051408504019603465109': {
    body: '[최근 수업은 어떠셨나요?]\n\n안녕하세요 #{닉네임} 회원님, 현재 #{선생님수}명의 선생님들과 수업을 진행 중이시네요. 최근 수업은 어떠셨는지 아래 버튼을 눌러 가볍게 말씀해주실 수 있을까요?\n\n편하신 시간에 남겨주시면 감사하겠습니다 🙏',
    buttons: ['최근 수업 근황 알리기', '수업을 진행하지 않았어요'],
  },
  'bizp_2026051409055519603300605': {
    body: '[최근 수업은 어떠셨나요?]\n\n안녕하세요 #{선생님닉네임} 선생님, 최근 진행하셨던 수업은 어떠셨는지 아래 버튼을 눌러 가볍게 말씀해주실 수 있을까요?\n\n편하신 시간에 남겨주시면 감사하겠습니다 🙏',
    buttons: ['최근 수업 근황 알리기', '수업을 진행하지 않았어요'],
  },
  'bizp_2026051409012325081752934': {
    body: '[최근 수업은 어떠셨나요?]\n\n안녕하세요 #{선생님닉네임} 선생님, 최근 진행하셨던 수업은 어떠셨는지 아래 버튼을 눌러 가볍게 말씀해주실 수 있을까요?\n\n📬 학부모님께서 선생님께 전달하신 내용도 도착해 있어요!\n\n편하신 시간에 남겨주시면 감사하겠습니다 🙏',
    buttons: ['최근 수업 근황 알리기', '수업을 진행하지 않았어요'],
  },
  'bizp_2026051409000319603898521': {
    body: '[최근 수업은 어떠셨나요?]\n\n안녕하세요 #{선생님닉네임} 선생님, #{학생닉네임} (#{과목}) 회원님과의 최근 수업은 어떠셨는지 아래 버튼을 눌러 가볍게 말씀해주실 수 있을까요?\n\n편하신 시간에 남겨주시면 감사하겠습니다 🙏',
    buttons: ['최근 수업 근황 알리기', '수업을 진행하지 않았어요'],
  },
  'bizp_2026051408550525081933775': {
    body: '[최근 수업은 어떠셨나요?]\n\n안녕하세요 #{선생님닉네임} 선생님, #{학생닉네임} (#{과목}) 회원님과의 최근 수업은 어떠셨는지 아래 버튼을 눌러 가볍게 말씀해주실 수 있을까요?\n\n📬 학부모님께서 선생님께 전달하신 내용도 도착해 있어요!\n\n편하신 시간에 남겨주시면 감사하겠습니다 🙏',
    buttons: ['최근 수업 근황 알리기', '수업을 진행하지 않았어요'],
  },
  'bizp_2026051408524619603686338': {
    body: '[첫 수업은 어떠셨나요?]\n\n안녕하세요 #{선생님닉네임} 선생님!\n\n#{학생닉네임} 회원님과의 첫 수업은 어떠셨나요?\n\n선생님이 직접 말씀하시기 어려운 부분이 있다면 김과외가 따뜻한 편지로 다듬어 부드럽게 전해드릴게요. 칭찬을 남겨주셔도 좋아요!\n\n아래 버튼을 눌러 어떤 식으로 전달되는지 확인 후, 지금 바로 남겨보세요! (평균 15초 소요)',
    buttons: ['남겨보기'],
  },
};

function renderBody(body: string) {
  // #{변수} 부분을 파란색으로 강조
  const parts = body.split(/(#\{[^}]+\})/g);
  return parts.map((part, i) =>
    part.startsWith('#{') ? (
      <span key={i} className="kakao-var">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function AlimtalkPreview({ templateCode }: { templateCode: string }) {
  const preview = TEMPLATE_PREVIEWS[templateCode];
  if (!preview) return null;

  return (
    <div className="kakao-preview-wrap">
      <p className="kakao-preview-label">알림톡 미리보기</p>
      <div className="kakao-chat-row">
        <div className="kakao-avatar">
          <span>김과외</span>
        </div>
        <div className="kakao-bubble">
          <div className="kakao-bubble-header">알림톡 도착</div>
          <div className="kakao-bubble-body">{renderBody(preview.body)}</div>
          {preview.buttons.map((btn) => (
            <div key={btn} className="kakao-bubble-btn">{btn}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

const schema = z.object({
  templateCode: requiredText,
  receiverNickname: requiredText,
  matchingKey: requiredText,
});

export function CheckinAlimtalkTab() {
  return (
    <div>
      <p className="page-title">체크인 알림톡 발송</p>
      <p className="page-subtitle">체크인 템플릿을 선택하고 수신 계정 닉네임을 입력하세요</p>

      <ActionForm
        title="📨 체크인 알림톡 발송"
        buttonLabel="발송"
        variant="send"
        schema={schema}
        backendPath="/admin/kakao/test/send"
        buildParams={(v) => ({
          templateCode: v.templateCode,
          receiverNickname: v.receiverNickname,
          matchingKey: v.matchingKey,
        })}
        action="alimtalk:send"
        dangerous
        confirmTitle="체크인 알림톡을 발송하시겠습니까?"
        confirmBody="해당 계정에 실제 알림톡이 발송됩니다."
      >
        {({ setField, values }) => {
          const selected = (values.templateCode as string | undefined) ?? '';
          const nicknameLabel = getNicknameLabel(selected);
          return (
            <div className="field">
              <div className="row">
                <div>
                  <label htmlFor="ci_templateCode">
                    템플릿 코드 <span className="required">*</span>
                  </label>
                  <select
                    id="ci_templateCode"
                    value={selected}
                    onChange={(e) => setField('templateCode', e.target.value)}
                  >
                    <option value="">-- 템플릿 선택 --</option>
                    {TEMPLATE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ci_receiverNickname">
                    {nicknameLabel} <span className="required">*</span>
                  </label>
                  <input
                    id="ci_receiverNickname"
                    type="text"
                    placeholder="닉네임 입력"
                    autoComplete="off"
                    value={(values.receiverNickname as string | undefined) ?? ''}
                    onChange={(e) => setField('receiverNickname', e.target.value)}
                  />
                </div>
              </div>
              <div className="row">
                <div>
                  <label htmlFor="ci_matchingKey">
                    matchingKey <span className="required">*</span>
                  </label>
                  <input
                    id="ci_matchingKey"
                    type="text"
                    placeholder="매칭 키 입력"
                    autoComplete="off"
                    value={(values.matchingKey as string | undefined) ?? ''}
                    onChange={(e) => setField('matchingKey', e.target.value)}
                  />
                </div>
              </div>
              <AlimtalkPreview templateCode={selected} />
            </div>
          );
        }}
      </ActionForm>
    </div>
  );
}
