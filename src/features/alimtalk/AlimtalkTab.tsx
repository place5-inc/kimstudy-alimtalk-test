import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const TEMPLATE_CODES = [
  'pay_cont_all_03_v2',
  'cont_cash_all_kim_v2',
  'msg_stpr_02_01_v2',
  'msg_stpr_02_04_v2',
  'cert_tu_02_02_v2',
  'join_stpr_01_01_v2',
  'join_tu_01_01_v2',
  'noti0_v2',
  'cert_tu_01_01_v2',
  'msg_tu_02_01_v2',
  'doc_tu_01_01_v2',
  'doc_tu_02_01_v2',
  'doc_tu_03_v2',
  'doc_tu_04_01_v2',
  'mat_stpr_01_v2',
  'mat_stpr_02_01_v2',
  'mat_tu_01_v2',
  'prog_tu_03_v2',
  'cus_stpr_01_v2',
  'noti99_v2',
  'cont_meta_tu_01_v2',
  'msg_pt_nm_01',
  'msg_pt_dm_01',
  'msg_pt_of_sc_00',
  'noti_cs_center_v1',
  'pmt_rqst_usr_1st_v1',
  'pmt_rqst_usr_2nd_v1',
  'pmt_rqst_no_usr_1st_v1',
  'pmt_rqst_no_usr_2nd_v1',
  'rqst_rv_1st_v1_new',
  'rqst_rv_2nd_v1',
  'crbt_mch_prt_wth_sbjt_v1',
];

const CHAT_ROOM_CODES = new Set([
  'msg_stpr_02_01_v2',
  'msg_stpr_02_04_v2',
  'noti0_v2',
  'msg_tu_02_01_v2',
  'mat_stpr_01_v2',
  'mat_tu_01_v2',
  'prog_tu_03_v2',
  'msg_pt_nm_01',
  'msg_pt_dm_01',
  'esc_tu_01_rev',
  'esc_tu_02',
  'canc_tu_01',
  'esc_tu_07',
  'msg_pt_of_sc_00',
  'mat_stpr_02_01_v2',
]);

const MATCHING_KEY_CODES = new Set([
  'rqst_rv_1st_v1_new',
  'rqst_rv_2nd_v1',
  'crbt_mch_prt_wth_sbjt_v1',
  'crbt_mch_prt_oth_sbjt_v1',
]);

interface TemplatePreview {
  body: string;
  buttons: string[];
}

const TEMPLATE_PREVIEWS: Record<string, TemplatePreview> = {
  'pay_cont_all_03_v2': {
    body: '[김과외] 구매 완료 안내\n김과외 학습자료실 캐시 구매가 완료되었습니다.\n\n◼️ 상품명: 학습자료실 캐시\n◼️ 충전금액: #{충전캐시} 캐시\n◼️ 구매일: #{결제날짜}\n\n지금 바로 학습자료실에서 자료를 구매하실 수 있어요.',
    buttons: ['김과외 바로가기'],
  },
  'cont_cash_all_kim_v2': {
    body: '[김과외] 캐시충전 안내\n김과외 학습자료실 캐시가 충전되었습니다.\n\n■ 상품명: 학습자료실 캐시\n■ 충전금액: #{충전금액}',
    buttons: ['김과외 바로가기'],
  },
  'msg_stpr_02_01_v2': {
    body: '김과외에서 과외 상담 중인 #{닉네임} 선생님에게 답장이 왔습니다.',
    buttons: ['김과외 바로가기'],
  },
  'msg_stpr_02_04_v2': {
    body: '김과외 상담 중이신 #{닉네임} 선생님께서 답장을 보내주셨습니다.\n\n수업 진행 의사가 없으신 경우, 짧은 답장이라도 꼭 보내주시면 선생님께 큰 도움이 됩니다.\n\n*선생님과 상담 후 수업 진행을 결정하셨다면, 채팅방 상단의 버튼을 클릭하여 성사 등록을 완료하시고, 과외비 페이백 혜택을 바로 받아보세요!!',
    buttons: ['김과외 바로가기'],
  },
  'cert_tu_02_02_v2': {
    body: '제출하신 완전인증 서류가 반려되었어요.\n\n반려사유\n#{반려사유}\n\n전체메뉴 > 인증서류 관리에서 완전인증 서류를 다시 등록하실 수 있어요.',
    buttons: ['완전인증 1분 가이드', '김과외 바로가기'],
  },
  'join_stpr_01_01_v2': {
    body: '안녕하세요!\n김과외에 오신 것을 환영합니다.\n\n■ 회원가입 시 작성한 과외 모집공고를 보고 선생님들이 먼저 과외를 제안할 수 있어요.\n\n■ [과외선생님 찾기]에서 원하는 선생님에게 먼저 상담을 요청할 수 있어요.\n\n■ 과외를 구한 후 [과외 모집공고 관리]에서 공고를 마감하면 해당 공고의 과외 제안받기를 중단할 수 있어요.\n\n■ 과외를 구하셨다면 채팅창에서 [이 선생님과의 과외를 결정] 버튼을 눌러주세요. 환불, 분쟁 등의 문제가 생겼을 때 김과외가 도움을 드릴 수 있어요.',
    buttons: ['김과외 바로가기'],
  },
  'join_tu_01_01_v2': {
    body: '안녕하세요!\n김과외에 오신 것을 환영합니다.\n\n■ [과외학생찾기] 에서 나에게 딱 맞는 과외 학생을 찾아보세요.\n\n■ [내 선생님 소개서]를 꼼꼼하게 작성할수록 과외가 매칭될 확률이 높아져요.\n\n■ 과외가 성사되었다면 늦어도 첫 수업일까지 성사등록을 완료해 주세요. 빨리 등록하실수록 랭킹이 빠르게 오릅니다.',
    buttons: ['김과외 바로가기'],
  },
  'noti0_v2': {
    body: '김과외에서 새 과외문의가 왔습니다.\n\n*해당 메세지는 회원님께서 요청하신 새 과외문의 알림이 있을 경우 발송됩니다. (수신거부:김과외앱 설정)',
    buttons: ['바로보기'],
  },
  'cert_tu_01_01_v2': {
    body: '완전인증이 승인되었어요.\n\n이제 김과외에서 학생, 학부모 회원들에게 먼저 과외를 제안하실 수 있어요.',
    buttons: ['김과외 바로가기'],
  },
  'msg_tu_02_01_v2': {
    body: '김과외에서 과외 상담 중인 #{닉네임} 회원에게 답장이 왔습니다.',
    buttons: ['김과외 바로가기'],
  },
  'doc_tu_01_01_v2': {
    body: '과외 영업서류 인증을 위해 제출하신 서류가 승인되었어요.\n\n- 제출서류: #{재학증명서}\n\n이제 내 소개서 > 선생님 정보에 #{재학증명서} 인증 내역이 표시돼요.\n\n지금 바로 확인해보세요!',
    buttons: ['김과외 바로가기'],
  },
  'doc_tu_02_01_v2': {
    body: '과외 영업서류 인증을 위해 제출하신 서류가 반려되었어요.\n\n- 제출서류 : #{재학증명서}\n- 반려사유 : #{재학증명서 발급 날짜를 가리지 말아주세요.}\n\n반려사유를 확인하시고 서류를 다시 제출해주시길 부탁드려요.',
    buttons: ['김과외 바로가기'],
  },
  'doc_tu_03_v2': {
    body: '안녕하세요. 선생님\n인증하신 과외 영업서류 중 #{재학증명서} 유효기간이 얼마 남지 않았어요.\n\n#{재학증명서}는 최근 #{6개월} 이내에 발급받은 서류로 등록해주셔야 합니다.\n\n- 서류명: #{재학증명서}\n- 발급일자: #{발급일자}\n- 만료일자: #{만료일자}\n\n만료일자 전에 서류를 꼭 갱신해주세요. 갱신하지 않으시면 (1) 내 소개서에서 인증내역이 삭제되고 (2) 과외 성사율이 내려갈 수 있어요.',
    buttons: ['김과외 바로가기'],
  },
  'doc_tu_04_01_v2': {
    body: '안녕하세요. 선생님\n제출하신 과외 영업서류 중 #{재학증명서} 유효기간이 만료되었어요.\n\n다시 서류를 인증받으시려면 전체메뉴> 인증 관리 메뉴에서 제출하실 수 있어요.',
    buttons: ['김과외 바로가기'],
  },
  'mat_stpr_01_v2': {
    body: '김과외에서 과외를 구하신 것을 축하드립니다!\n\n과외성사 혜택을 안내드려요.\n■ 환불, 분쟁 발생 시 고객센터 지원\n■ 첫 달 과외비의 0.5퍼센트 페이백\n■ 후기 작성 시 0.5퍼센트 페이백\n■ 첫 달 과외비의 2퍼센트 학습자료실 캐시백\n■ 엄마들을 위한 대치동교육 강의 할인쿠폰\n\n#{닉네임} 선생님의 수업에 대해 의견을 남기고 싶으시다면\n■ 수업 시작 2주 후부터 후기 작성이 가능해요.\n■ 문제가 있는 경우 평판을 남기거나 신고하실 수 있어요.\n\n아직 혜택을 받지 못하신 분은 김과외 고객센터로 문의해주세요.',
    buttons: ['김과외 바로가기'],
  },
  'mat_stpr_02_01_v2': {
    body: '#{학생학부모 닉네임}님, 안녕하세요.\n원하는 과외를 찾으신 것을 축하드려요!\n\n■ 선생님: #{선생님 닉네임}\n■ 첫 수업일: #{yyyy-mm-dd}\n■ 수업료: #{선생님이 등록한 수업료}원\n\n과외성사 혜택을 받으시려면 선생님과의 채팅방에서 [성사등록하고 페이백받기] 버튼을 누르시고 혜택을 받으실 정보를 입력해주세요.\n\n혹시 성사된 과외 정보가 다르다면 수정해서 입력해주시면 됩니다.',
    buttons: ['김과외 바로가기'],
  },
  'mat_tu_01_v2': {
    body: '#{선생님 닉네임}님, 안녕하세요.\n학생(학부모) 회원이 먼저 성사등록한 정보를 보내드려요. 이 학생과 수업을 진행하기로 하셨을까요?\n\n■ 학생(학부모): #{학생학부모 닉네임}\n■ 첫 수업일: #{yyyy-mm-dd}\n■ 수업료: #{학생학부모 회원이 등록한 수업료}원\n\n채팅방에서 성사등록을 하시면 선생님 랭킹이 바로 올라가고, 선생님 목록에서 더 상단에 노출돼요. 또한 김과외 경력에도 자동 등록됩니다.\n\n혹시 학생(학부모) 회원이 등록한 과외 정보가 다르다면 수정해서 성사등록을 해주시면 됩니다.',
    buttons: ['김과외 바로가기'],
  },
  'prog_tu_03_v2': {
    body: '#{닉네임} 선생님, 새로운 메시지가 도착했어요.\n\n지금 바로 메시지를 확인해보세요!',
    buttons: ['김과외 바로가기'],
  },
  'cus_stpr_01_v2': {
    body: '#{5}명의 선생님에게 새로운 과외제안이 도착했습니다.\n\n좋은 선생님을 놓치지 않도록 과외제안을 바로 확인해볼까요?\n\n*해당 알림은 회원님께서 요청하신 과외 제안이 있을 경우 발송되며, 새로운 과외제안을 받은 날마다 1일 1회 발송됩니다.(수신설정: 설정> 알림관리)',
    buttons: ['김과외 바로가기'],
  },
  'noti99_v2': {
    body: '안녕하세요 선생님, 김과외입니다.\n\n#{서울 금천구} 지역에서 #{수학, 영어} 과외를 구하는 학생이 방금 가입했습니다. 선생님께서 찾던 학생이어서 안내 알림 드렸습니다. 학생에게 빠르게 과외 신청 메시지를 보내보시는 것은 어떠세요~?^^\n\n* 해당 메시지는 선생님께서 요청하신 맞춤 과외정보 알림으로, 과외 학생이 새로 가입했거나 선생님 모집을 다시 시작했을 때, 과목 및 지역이 맞는 선생님들 중 선생님 랭킹 및 우선지역 등을 고려해서 소수의 분들에게만 특별히 드리는 알림입니다. (수신거부:김과외앱 설정)',
    buttons: ['바로보기'],
  },
  'cont_meta_tu_01_v2': {
    body: '#{닉네임} 님, 김과외에서 구매하신 메타수학 문제은행 요금제가 곧 만료될 예정이에요!\n\n■ 상품명: 메타수학 문제은행 과외선생님 전용 요금제\n■ 만료일: #{만료일}\n\n저장한 학생정보와 문제지 등을 계속 이용하고자 하실 경우, 요금제 기간을 연장해주세요.',
    buttons: ['김과외 바로가기'],
  },
  'msg_pt_nm_01': {
    body: '안녕하세요 선생님, 김과외입니다 :)\n#{닉네임}회원님과의 첫 수업은 잘 진행하셨나요~?\n\n수업 후, 수업료를 납부 받으셨다면 아래 버튼을 누르신 다음, 상대 회원님과의 채팅방에서 빠르게 성사등록을 완료해주세요!\n\n✅선생님께서 입력하신 수업 정보\n· 과목 : #{과목명}\n· 첫 수업일 : #{첫수업일자}',
    buttons: ['김과외 바로가기'],
  },
  'msg_pt_dm_01': {
    body: '안녕하세요 선생님, 김과외입니다 :)\n#{닉네임}회원님과의 시범과외는 잘 진행하셨나요~?\n\n수업 후, 정규과외를 진행하기로 하셨다면 아래 버튼을 눌러 빠르게 성사등록을 완료해주세요!\n\n✅ 선생님께서 입력하신 수업 정보\n· 과목 : #{과목명}\n· 시범과외 수업일 : #{첫수업일자}',
    buttons: ['김과외 바로가기'],
  },
  'msg_pt_of_sc_00': {
    body: '김과외에서 새 과외문의가 왔습니다.\n\n* 해당 메시지는 회원님께서 직접 만드신 김과외 모집공고에 선생님이 과외 제안을 하신 경우에만 발송됩니다.',
    buttons: ['바로가기'],
  },
  'noti_cs_center_v1': {
    body: '김과외 이용요금 안내센터의 메시지가 도착했습니다.\n\n선생님께서 진행중인 상담과 관련하여 과외 성사 여부 확인을 위해 이용요금 안내센터에서 메시지를 보냈습니다. 확인 부탁드립니다 🙏',
    buttons: ['바로가기'],
  },
  'pmt_rqst_usr_1st_v1': {
    body: '[#{선생님이름} 선생님의 수업료 납부 요청서가 도착했어요!]\n\n안녕하세요 회원님, 김과외입니다.\n\n회원님의 납부 편의를 위해, #{선생님이름} 선생님의 요청이 있을 때마다\n이 채팅방을 통해 수업료 납부요청서를 보내드릴 예정이에요.\n\n아래 버튼을 누르시면, 이번에 납부하실 수업료 확인 및 선생님 계좌번호 간편 복사가 가능해요.\n\n확인 후 수업료를 납부해주시면 감사하겠습니다 🙏\n\n* 해당 메시지는 선생님의 요청으로 수업료 안내가 필요한 경우에만 발송됩니다.',
    buttons: ['납부 요청서 확인하기'],
  },
  'pmt_rqst_usr_2nd_v1': {
    body: '[수업료 납부 요청]\n\n안녕하세요 회원님, 김과외입니다.\n\n#{선생님이름} 선생님의 납부 요청서 확인 후, 수업료를 납부해주시면 감사하겠습니다 🙏\n\n* 해당 메시지는 선생님의 요청으로 수업료 안내가 필요한 경우에만 발송됩니다.',
    buttons: ['납부 요청서 확인하기'],
  },
  'pmt_rqst_no_usr_1st_v1': {
    body: '[#{선생님실명이름} 선생님의 수업료 납부 요청서가 도착했어요!]\n\n안녕하세요, 대한민국 대표 과외 플랫폼 김과외입니다!\n\n#{선생님실명이름} 선생님께서 김과외를 통해 수업료 납부 요청서를 보내셨어요. 앞으로도 선생님의 요청이 있을 때마다 이 채널을 통해 보내드릴 예정이에요.\n\n아래 버튼을 누르시면, 이번에 납부하실 수업료 확인 및 선생님 계좌번호 간편 복사가 가능해요.\n\n확인 후 수업료를 납부해주시면 감사하겠습니다 🙏\n\n* 해당 메시지는 선생님의 요청으로 수업료 안내가 필요한 경우에만 발송됩니다.',
    buttons: ['납부 요청서 확인하기'],
  },
  'pmt_rqst_no_usr_2nd_v1': {
    body: '[수업료 납부 요청]\n\n안녕하세요, 김과외입니다.\n\n#{선생님실명이름} 선생님의 납부요청서 확인 후 수업료를 납부해주시면 감사하겠습니다 🙏\n\n* 해당 메시지는 선생님의 요청으로 수업료 안내가 필요한 경우에만 발송됩니다.',
    buttons: ['납부 요청서 확인하기'],
  },
  'rqst_rv_1st_v1_new': {
    body: '[수업 시작 2주째! 후기를 남겨주실 수 있을까요? ✏️]\n\n안녕하세요, #{닉네임} 회원님!\n\n#{선생님명} 선생님과 #{과목} 수업을 시작하신 지 벌써 2주가 지났습니다!\n\n수업 후기를 남겨주시면 다른 회원님, 그리고 선생님께 큰 도움이 됩니다!\n\n편하신 시간에 후기 남겨주시고 꼭 혜택 받아가시기를 바라겠습니다 🙏',
    buttons: ['후기 남기기'],
  },
  'rqst_rv_2nd_v1': {
    body: '[후기 작성은 선생님께 큰 도움이 됩니다! ✏️]\n\n안녕하세요, #{닉네임} 회원님!\n\n#{선생님명} 선생님과의 수업에 대한 후기를 남겨주시면 다른 회원님, 그리고 선생님께 큰 도움이 됩니다!\n\n편하신 시간에 후기 남겨주시면 감사하겠습니다 🙏',
    buttons: ['후기 남기기'],
  },
  'crbt_mch_prt_wth_sbjt_v1': {
    body: '[과외 성사를 축하드립니다!]\n\n📢 과외성사 혜택을 안내드려요.\n\n■ 환불, 분쟁 발생 시 고객센터 지원\n■ 첫 달 과외비의 0.5% 페이백\n■ 후기 작성 시 0.5% 추가 페이백 등\n\n아래 버튼을 눌러 수업 정보 확인 후, 다른 점이 있다면 꼭 말씀해주세요!',
    buttons: ['수업 정보 확인하기'],
  },
};

function renderBody(body: string) {
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

const schema = z
  .object({
    templateCode: requiredText,
    receiverNickname: requiredText,
    chatRoomId: z.string().trim().default(''),
    matchingKey: z.string().trim().default(''),
  })
  .superRefine((data, ctx) => {
    if (CHAT_ROOM_CODES.has(data.templateCode) && !data.chatRoomId) {
      ctx.addIssue({
        code: 'custom',
        path: ['chatRoomId'],
        message: 'chatRoomId는 필수입니다.',
      });
    }
    if (MATCHING_KEY_CODES.has(data.templateCode) && !data.matchingKey) {
      ctx.addIssue({
        code: 'custom',
        path: ['matchingKey'],
        message: 'matchingKey는 필수입니다.',
      });
    }
  });

export function AlimtalkTab() {
  return (
    <div>
      <p className="page-title">알림톡 발송</p>
      <p className="page-subtitle">템플릿을 선택하고 수신 계정 닉네임을 입력하세요</p>

      <ActionForm
        title="📨 알림톡 발송"
        buttonLabel="발송"
        variant="send"
        schema={schema}
        backendPath="/admin/kakao/test/send"
        buildParams={(v) => {
          const params: Record<string, string> = {
            templateCode: v.templateCode,
            receiverNickname: v.receiverNickname,
          };
          if (v.chatRoomId) params.chatRoomId = v.chatRoomId;
          if (v.matchingKey) params.matchingKey = v.matchingKey;
          return params;
        }}
        action="alimtalk:send"
        dangerous
        confirmTitle="알림톡을 발송하시겠습니까?"
        confirmBody="해당 계정에 실제 알림톡이 발송됩니다."
      >
        {({ setField, values }) => {
          const selected = (values.templateCode as string | undefined) ?? '';
          const needsChatRoom = CHAT_ROOM_CODES.has(selected);
          const needsMatchingKey = MATCHING_KEY_CODES.has(selected);

          return (
            <div className="field">
              <div className="row">
                {/* 좌측: 템플릿 선택 + 미리보기 */}
                <div>
                  <label htmlFor="at_templateCode">
                    템플릿 코드 <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select
                      id="at_templateCode"
                      value={selected}
                      onChange={(e) => setField('templateCode', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">-- 템플릿 선택 --</option>
                      {TEMPLATE_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ width: 'auto', padding: '8px 12px', whiteSpace: 'nowrap', marginTop: 0 }}
                      disabled={!selected}
                      onClick={() => selected && navigator.clipboard.writeText(selected)}
                    >
                      복사
                    </button>
                  </div>
                  <AlimtalkPreview templateCode={selected} />
                </div>

                {/* 우측: 닉네임 + 조건부 필드 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label htmlFor="at_receiverNickname">
                      알림톡 수신받을 계정의 닉네임 <span className="required">*</span>
                    </label>
                    <input
                      id="at_receiverNickname"
                      type="text"
                      placeholder="닉네임 입력"
                      autoComplete="off"
                      value={(values.receiverNickname as string | undefined) ?? ''}
                      onChange={(e) => setField('receiverNickname', e.target.value)}
                    />
                  </div>

                  {needsChatRoom && (
                    <div>
                      <label htmlFor="at_chatRoomId">
                        chatRoomId <span className="required">*</span>
                      </label>
                      <input
                        id="at_chatRoomId"
                        type="text"
                        placeholder="채팅방 ID 입력"
                        autoComplete="off"
                        value={(values.chatRoomId as string | undefined) ?? ''}
                        onChange={(e) => setField('chatRoomId', e.target.value)}
                      />
                    </div>
                  )}

                  {needsMatchingKey && (
                    <div>
                      <label htmlFor="at_matchingKey">
                        matchingKey <span className="required">*</span>
                      </label>
                      <input
                        id="at_matchingKey"
                        type="text"
                        placeholder="매칭 키 입력"
                        autoComplete="off"
                        value={(values.matchingKey as string | undefined) ?? ''}
                        onChange={(e) => setField('matchingKey', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      </ActionForm>
    </div>
  );
}
