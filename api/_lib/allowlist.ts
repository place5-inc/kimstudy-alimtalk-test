/**
 * 백엔드(Azure) API 경로 화이트리스트.
 * 새 어드민 기능을 추가할 때 여기에 등록하지 않으면 프록시가 403을 반환합니다.
 *
 * 각 엔트리:
 *  - path: 정규식. 백엔드의 path 부분만 매칭 (querystring 제외)
 *  - method: 허용 HTTP 메서드
 *  - dangerous: true면 위험 액션 → confirm 토큰 필수
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
    path: /^\/api\/admin\/test\/matching\/scheduler$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'matching:reset',
    path: /^\/api\/admin\/test\/reset\/chat\/respond$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'demo:reset',
    path: /^\/api\/admin\/test\/reset\/demo\/respond$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'dormant:pending',
    path: /^\/api\/admin\/test\/dormant\/pending$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'dormant:done',
    path: /^\/api\/admin\/test\/dormant\/done$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'dormant:reset',
    path: /^\/api\/admin\/test\/dormant\/reset$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'engagePopup:reset',
    path: /^\/api\/admin\/test\/reset\/engagePopup$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'recovery:send',
    path: /^\/api\/admin\/test\/push\/recovery$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'recovery:reset',
    path: /^\/api\/admin\/test\/reset\/recovery$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'review:send',
    path: /^\/api\/admin\/test\/push\/review$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'review:reset',
    path: /^\/api\/admin\/test\/reset\/review\/push$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'fomo:send',
    path: /^\/api\/admin\/test\/push\/fomo$/,
    method: 'GET',
    dangerous: true,
  },
  {
    action: 'fomo:reset',
    path: /^\/api\/admin\/test\/reset\/fomo\/push$/,
    method: 'GET',
    dangerous: false,
  },
  {
    action: 'quickReply:reset',
    path: /^\/api\/admin\/test\/lesson\/quickReply\/reset$/,
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
