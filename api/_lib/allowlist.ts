/**
 * 백엔드(Azure) API 경로 화이트리스트.
 *
 * 중요: 여기의 `path`는 백엔드의 `/api` prefix를 제외한 부분입니다.
 *   - 실제 백엔드 URL: https://...azurewebsites.net/api/admin/test/...
 *   - allowlist의 path: /admin/test/...
 * 이유: 클라이언트가 보내는 URL(/api/proxy/...)에 /api가 두 번 들어가면
 *       Vercel 라우팅이 catch-all로 보내지 못하고 자체 404를 냅니다.
 *       그래서 클라/프록시 사이에서는 /api를 빼고, 백엔드 호출 시
 *       `backend.ts`가 자동으로 /api를 붙입니다.
 *
 * 새 어드민 기능을 추가할 때 여기에 등록하지 않으면 프록시가 403을 반환합니다.
 */
export interface AllowlistEntry {
  path: RegExp;
  method: 'GET' | 'POST';
  dangerous: boolean;
  action: string;
}

export const ALLOWLIST: readonly AllowlistEntry[] = [
  {
    action: 'matching:send',
    path: /^\/admin\/test\/matching\/scheduler$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'matching:reset',
    path: /^\/admin\/test\/reset\/chat\/respond$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'demo:reset',
    path: /^\/admin\/test\/reset\/demo\/respond$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'dormant:pending',
    path: /^\/admin\/test\/dormant\/pending$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'dormant:done',
    path: /^\/admin\/test\/dormant\/done$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'dormant:reset',
    path: /^\/admin\/test\/dormant\/reset$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'engagePopup:reset',
    path: /^\/admin\/test\/reset\/engagePopup$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'recovery:send',
    path: /^\/admin\/test\/push\/recovery$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'recovery:reset',
    path: /^\/admin\/test\/reset\/recovery$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'review:send',
    path: /^\/admin\/test\/push\/review$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'review:reset',
    path: /^\/admin\/test\/reset\/review\/push$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'fomo:send',
    path: /^\/admin\/test\/push\/fomo$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'fomo:reset',
    path: /^\/admin\/test\/reset\/fomo\/push$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'quickReply:reset',
    path: /^\/admin\/test\/lesson\/quickReply\/reset$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'authPhone:check',
    path: /^\/admin\/test\/auth\/phone$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'alimtalk:send',
    path: /^\/admin\/kakao\/test\/send$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'reviewCampaign:send',
    path: /^\/admin\/test\/review\/test\/kakao\/resend-missing$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'reviewCampaign:reset',
    path: /^\/admin\/test\/review\/test\/reset\/resend-missing$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'passAuth:reset',
    path: /^\/admin\/test\/reset\/pass\/auth$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'sincerityDemotion:check',
    path: /^\/admin\/test\/check\/degradeBlack$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'sincerityDemotion:set',
    path: /^\/admin\/test\/set\/degradeBlack\/nickname$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'sincerityDemotion:clearByNick',
    path: /^\/admin\/test\/clear\/degradeBlack\/nickname$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'sincerityDemotion:clearByPhone',
    path: /^\/admin\/test\/clear\/degradeBlack\/phone$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'kimInstructor:joinHistoryReset',
    path: /^\/admin\/academy\/consulting\/reset\/kimacademy\/phoneNumber$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'kimInstructor:postDelete',
    path: /^\/admin\/academy\/consulting\/delete\/kimacademy\/jobOffer$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'kimInstructor:accountRecovery',
    path: /^\/admin\/academy\/consulting\/revoke\/kimacademy\/account$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'kimInstructor:passAuth',
    path: /^\/admin\/academy\/consulting\/accept\/kimacademy\/pass$/,
    method: 'GET',
    dangerous: false,
  },
];

export function matchAllowlist(
  method: string,
  path: string,
): AllowlistEntry | null {
  const m = method.toUpperCase();
  for (const entry of ALLOWLIST) {
    if (entry.method === m && entry.path.test(path)) return entry;
  }
  return null;
}

export function isKnownAction(action: string): boolean {
  return ALLOWLIST.some((e) => e.action === action);
}
