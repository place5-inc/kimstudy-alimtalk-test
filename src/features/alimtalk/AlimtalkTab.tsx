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

const schema = z
  .object({
    templateCode: requiredText,
    receiverNickname: requiredText,
    chatRoomId: z.string().trim(),
    matchingKey: z.string().trim(),
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
                <div>
                  <label htmlFor="at_templateCode">
                    템플릿 코드 <span className="required">*</span>
                  </label>
                  <select
                    id="at_templateCode"
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
              </div>

              {needsChatRoom && (
                <div className="row">
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
                </div>
              )}

              {needsMatchingKey && (
                <div className="row">
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
                </div>
              )}
            </div>
          );
        }}
      </ActionForm>
    </div>
  );
}
