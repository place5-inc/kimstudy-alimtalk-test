# 김과외 어드민 (kimstudy-alimtalk-test)

8개 어드민 기능(성사누락/시범전환/휴면전환/과외구함팝업/이탈복구/리뷰알림/FOMO/간편답변 초기화)을 단일 공유 비밀번호로 보호하는 React + Vite + TypeScript 어드민 도구.

배포: Vercel · 외부 DB 없음 · 보안 헤더 적용 · 비밀번호 회전 가능.

> 비개발자 테스터들도 Vercel 가입 없이 production URL + 비밀번호만으로 접속합니다.

## 빠른 시작 (운영자)

```bash
npm install
npm run setup-secrets   # 인터랙티브: 비밀번호 입력 → .env.local + Vercel env 자동 설정
git push                 # Vercel 자동 배포
```

스크립트가 출력한 `BACKEND_SHARED_SECRET`을 백엔드팀에 안전한 채널로 공유 후 [BACKEND_REQUEST.md](BACKEND_REQUEST.md)를 전달하세요.

## 보안 한눈에

- **로그인**: 서버에서 bcrypt 해시 비교 → JWT(HS256) → HttpOnly+Secure+SameSite=Strict 쿠키
- **비밀번호 회전**: `PW_VERSION` 환경변수만 올리면 기존 모든 세션 즉시 무효화 ([PASSWORD_ROTATION.md](PASSWORD_ROTATION.md))
- **백엔드 호출**: 브라우저 → `/api/proxy/*` (Vercel 서버) → Bearer 토큰 첨부해서 Azure API. 브라우저는 Azure URL을 모름
- **경로 화이트리스트**: 허용된 백엔드 경로 외에는 403 ([api/_lib/allowlist.ts](api/_lib/allowlist.ts))
- **위험 액션 확인**: 발송/처리류는 30초 confirm 토큰 + 모달 이중 확인
- **CSP/HSTS/XFO** 등 보안 헤더 ([vercel.json](vercel.json))
- **Preview 배포 자동 차단**: 환경변수가 Production scope에만 있어 Preview URL은 자동 500

## 새 어드민 기능 추가하기

세 파일만 건드리면 됩니다 → [DEVELOPMENT.md](DEVELOPMENT.md)

## 로컬 개발

```bash
npm install
npm run setup-secrets        # .env.local 생성
npm run vercel-dev           # Vercel CLI 필요 — 서버 + 클라이언트 통합 dev (권장)
# 또는
npm run dev                  # vite 단독 (API 호출은 작동 안함)
```

`vercel dev`는 `/api/*`도 같이 서빙해서 통합 테스트가 가능합니다.

## 운영 관리

- 비밀번호 변경: [PASSWORD_ROTATION.md](PASSWORD_ROTATION.md)
- 백엔드 작업 요청: [BACKEND_REQUEST.md](BACKEND_REQUEST.md)
- 코드 구조/확장 가이드: [DEVELOPMENT.md](DEVELOPMENT.md)
