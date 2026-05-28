# 개발 가이드

이 사이트를 이어받아 새 기능을 추가할 때 참고하세요. AI(Claude/Cursor 등)에게 작업을 시킬 때도 먼저 읽혀주세요.

## 아키텍처 한눈에

- **Frontend**: React 18 + Vite + TypeScript + React Router (`src/`)
- **Server**: Vercel Serverless Functions in Node.js (`api/`)
- **인증**: 단일 공유 비밀번호 → 서버에서 bcrypt 검증 → JWT(HS256) → HttpOnly+Secure+SameSite=Strict 쿠키. `pwVersion` 클레임으로 회전 시 즉시 무효화.
- **백엔드 호출 경로**: 브라우저 → `/api/proxy/[...path]` (Vercel 서버) → 백엔드 Azure API + Bearer 시크릿 첨부. 브라우저는 백엔드 URL을 모름.
- **외부 DB**: 없음. JWT가 stateless라 Redis 불필요. Rate limit은 in-memory(best-effort).
- **위험 액션**: 클라이언트 ConfirmModal + 서버 confirm 토큰 (30초 TTL) 이중 확인.

```
┌─────────┐   /api/proxy/...    ┌─────────────┐   Bearer    ┌─────────────┐
│ Browser │ ─────────────────▶ │ Vercel      │ ───────────▶│ Azure API   │
│ (React) │ ◀───────────────── │ Functions   │ ◀────────── │ (admin/test)│
└─────────┘    (JWT cookie)     └─────────────┘             └─────────────┘
```

## 폴더 구조

```
api/                              # 서버 (Vercel Serverless)
  auth/{login,logout,me}.ts       # 인증
  admin/confirm.ts                # 위험 액션 confirm 토큰 발급
  proxy/[...path].ts              # 백엔드 프록시 (인증+allowlist+Bearer)
  _lib/                           # 서버 전용 헬퍼 (라우팅 제외)
    env.ts, jwt.ts, password.ts, session.ts,
    ratelimit.ts, allowlist.ts, backend.ts, csrf.ts

src/                              # 클라이언트 (React)
  main.tsx, App.tsx
  routes/{LoginPage,AdminPage}.tsx
  features/<name>/<Name>Tab.tsx   # 탭 단위 (확장 지점)
  shared/
    api/client.ts                 # fetch 래퍼
    auth/{AuthProvider,ProtectedRoute}.tsx
    ui/{Toast,ResultBox,ConfirmModal,ActionForm}.tsx
    config/tabsConfig.ts          # 탭 메타 (single source of truth)
    styles/globals.css

scripts/
  setup-secrets.mjs               # 초기 설정 + 회전
  hash-password.mjs               # 평문 → bcrypt 해시
```

## 새 어드민 탭 추가하기

세 파일만 건드리면 됩니다.

### 1. UI 컴포넌트 작성 — `src/features/<name>/<Name>Tab.tsx`

`ActionForm`을 재사용하면 입력 검증 + 결과 표시 + confirm 모달이 자동입니다.

```tsx
import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ nickname: requiredText });

export function MyNewTab() {
  return (
    <div>
      <p className="page-title">새 기능 제목</p>
      <p className="page-subtitle">한 줄 설명</p>

      <ActionForm
        title="📤 무엇을 합니다"
        buttonLabel="실행"
        variant="send"             // 'send' | 'pending' | 'done' | 'reset'
        schema={schema}
        backendPath="/api/admin/test/my-new-thing"
        buildParams={(v) => ({ nickname: v.nickname })}
        action="myNew:send"        // allowlist의 action과 일치해야 함
        dangerous                  // 위험 액션이면 true
        confirmTitle="실행하시겠습니까?"
        confirmBody="실제로 처리됩니다."
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="mn_nick">
              nickname <span className="required">*</span>
            </label>
            <input id="mn_nick" type="text" {...register('nickname')} />
          </div>
        )}
      </ActionForm>
    </div>
  );
}
```

### 2. 탭 등록 — `src/shared/config/tabsConfig.ts`

```ts
import { MyNewTab } from '../../features/my-new/MyNewTab';

export const TABS = [
  // ... 기존 탭
  { id: 'my-new', label: '9. 새 기능', component: MyNewTab },
];
```

### 3. 백엔드 경로 화이트리스트 — `api/_lib/allowlist.ts`

```ts
{
  action: 'myNew:send',
  path: /^\/api\/admin\/test\/my-new-thing$/,
  method: 'GET',
  dangerous: true,    // 위험 액션이면 true → confirm 토큰 필수
},
```

**중요**: action 문자열은 `tabsConfig`/`ActionForm`/`allowlist` 셋에서 동일해야 합니다. 누락 시 프록시가 403을 반환합니다.

라우팅·메뉴·인증·CSRF는 자동 처리됩니다.

## 보안 룰 (절대 어기지 마세요)

- **비밀번호/시크릿을 Git에 커밋 금지.** `.env.local`은 `.gitignore`에 포함됨. PR 직전 `git diff`로 확인.
- **새 백엔드 경로 추가 시 반드시 `allowlist.ts`에 등록.** 등록 안 하면 403.
- **새 env 추가 시 `api/_lib/env.ts`의 zod 스키마에 추가 + `.env.example` 업데이트.** 둘 다 빠뜨리면 부팅 검증이 무력해짐.
- **입력은 무조건 zod로 검증** 후 서버로 전송. 서버에서도 다시 검증.
- **보안 헤더(`vercel.json`)와 CSP를 약화시키지 마세요.** 외부 CDN 스크립트를 추가하려면 차라리 번들에 포함시킬 것.
- **JWT를 opaque 세션으로 바꾸지 마세요.** Stateless여야 외부 DB 불필요. 회전은 `PW_VERSION` 메커니즘으로 충분.
- **위험 액션은 반드시 `dangerous: true`** → confirm 토큰 강제.

## AI에게 작업 시킬 때

AI에 작업을 위임할 때 다음 컨텍스트를 먼저 읽혀주세요:
- `README.md`, `DEVELOPMENT.md`, `BACKEND_REQUEST.md`

특히 강조할 점:
- 보안 헤더와 CSP를 약화시키지 말 것
- 새 백엔드 경로는 무조건 `api/_lib/allowlist.ts`에 등록
- 비밀번호 회전이 즉시 효력 발휘해야 함 (JWT 도입 유지, opaque/Redis 도입 금지)
- 사용자 입력은 zod로 검증 후 서버로 전송
- 위험 액션(발송/대량삭제 등)은 항상 `dangerous: true`
- 새 env 추가 시 `api/_lib/env.ts` zod 스키마 동기화 필수

## 로컬 개발

```bash
npm install
npm run setup-secrets        # .env.local 생성
npm run vercel-dev           # 통합 dev (서버 + 클라) — Vercel CLI 필요
# 또는
npm run dev                  # vite 단독 (API는 작동 안함, UI 확인용)
```

타입 체크:
```bash
npm run typecheck
```

## 배포

main 브랜치 push → Vercel 자동 배포. 환경변수는 Production scope에만 등록되어 있어 Preview URL은 자동 차단됩니다.

## 비밀번호 변경

[PASSWORD_ROTATION.md](PASSWORD_ROTATION.md) 참고.
