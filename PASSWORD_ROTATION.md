# 비밀번호 변경하기

테스트 기간이 끝나서 외부 접속을 막거나, 정기적으로 비밀번호를 바꿀 때 따라하세요.

비밀번호를 바꾸면 **기존에 로그인한 모든 사람이 즉시 로그아웃**되고, 새 비밀번호를 모르면 다시 들어올 수 없습니다.

---

## 방법 A: 스크립트 한 번 (권장)

이 방법은 새 비밀번호를 입력받아 해시 생성 + Vercel env 자동 갱신 + PW_VERSION 자동 증가까지 한 번에 처리합니다.

```bash
cd kimstudy-alimtalk-test
npm install            # 처음 한 번만
npm run setup-secrets  # 인터랙티브 — 새 비밀번호 두 번 입력
```

스크립트가 끝나면:
1. Vercel CLI 자동 등록을 'Y'로 답했다면 → 자동 완료. 잠시 후 자동 재배포 시작.
2. 'N'으로 답했거나 Vercel CLI가 없으면 → 화면에 표시된 값을 Vercel 대시보드에 수동 등록.

**주의**: 같은 이름의 env가 이미 있으면 CLI가 추가 실패합니다. Vercel 대시보드에서 해당 env를 먼저 삭제하고 다시 실행하세요.

> 이 방법은 `BACKEND_SHARED_SECRET`과 `JWT_SIGNING_SECRET`도 새로 바꿉니다. 이건 부수효과로 백엔드팀에 새 시크릿을 다시 전달해야 합니다. **시크릿은 그대로 두고 비밀번호만 바꾸려면 방법 B를 사용하세요.**

---

## 방법 B: 비밀번호만 바꾸기 (시크릿 유지)

백엔드와 공유 중인 시크릿을 건드리고 싶지 않을 때.

### 1. 새 해시 생성
```bash
npm install            # 처음 한 번만
node scripts/hash-password.mjs '새비밀번호'
```
출력된 `$2a$12$...` 문자열 복사.

### 2. Vercel 대시보드에서 env 두 개 갱신
1. https://vercel.com → 이 프로젝트 → **Settings → Environment Variables**
2. `ADMIN_PW_HASH` 옆 ··· → Edit → 위에서 복사한 해시로 교체 → Save
3. `PW_VERSION` 옆 ··· → Edit → 숫자 +1 (예: 1 → 2) → Save

### 3. 재배포
1. **Deployments** 탭으로 이동
2. 최근 production 배포 옆 ··· → **Redeploy** → Use existing Build Cache 체크 해제 권장 → Redeploy
3. 2~3분 후 배포 완료

### 4. 확인
- 사이트 접속 → 자동으로 `/login`으로 리다이렉트되면 성공 (기존 세션 무효)
- 새 비밀번호로 로그인 OK

---

## 테스터들에게 알리기

비밀번호를 바꾸면 그 즉시 모두가 로그아웃됩니다. 미리 안내하거나, 새 비밀번호를 같이 전달하세요.

---

## 트러블슈팅

**문제**: 사이트가 500 에러를 띄움
**원인**: env 누락 또는 형식 오류 (예: `PW_VERSION`에 숫자 아닌 값)
**해결**: Vercel 대시보드 → Logs → 함수 로그에서 `환경변수 검증 실패` 메시지 확인 후 수정

**문제**: Vercel CLI `vercel env add` 실패
**원인**: 같은 이름의 env가 이미 존재
**해결**: 대시보드에서 해당 env 삭제 후 재실행 (또는 대시보드에서 직접 Edit)

**문제**: 백엔드 호출이 401
**원인**: `BACKEND_SHARED_SECRET`이 Vercel과 백엔드 양쪽에서 불일치
**해결**: 양쪽 값을 다시 동기화 (백엔드 팀에 새 값 공유)
