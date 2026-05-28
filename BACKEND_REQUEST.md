# 백엔드 작업 요청: 어드민 테스트 API에 Bearer 인증 추가

## 배경

`kimstudy-alimtalk-test` 어드민 도구가 새로 만들어졌고, 백엔드의 어드민 테스트 API 엔드포인트들을 Vercel 서버리스 프록시를 통해 호출합니다. 현재 백엔드 API는 인증이 없어서 URL만 알면 누구나 호출 가능합니다.

**요청 사항**: `/api/admin/test/**` 경로 전체에 `Authorization: Bearer <시크릿>` 검증을 추가해주세요. 시크릿 없으면 401.

---

## 사양

### 검증 대상 경로
다음 경로들에 모두 적용해주세요:

```
/api/admin/test/matching/scheduler          (GET)
/api/admin/test/reset/chat/respond           (GET)
/api/admin/test/reset/demo/respond           (GET)
/api/admin/test/dormant/pending              (GET)
/api/admin/test/dormant/done                 (GET)
/api/admin/test/dormant/reset                (GET)
/api/admin/test/reset/engagePopup            (GET)
/api/admin/test/push/recovery                (GET)
/api/admin/test/reset/recovery               (GET)
/api/admin/test/push/review                  (GET)
/api/admin/test/reset/review/push            (GET)
/api/admin/test/push/fomo                    (GET)
/api/admin/test/reset/fomo/push              (GET)
/api/admin/test/lesson/quickReply/reset      (GET)
```

가장 간단한 방법은 `/api/admin/test/**` 전체에 미들웨어/필터를 거는 것입니다.

### 검증 로직

1. 요청에 `Authorization` 헤더가 있는지 확인. 없으면 401.
2. 값이 `Bearer ` 접두사로 시작하는지 확인. 아니면 401.
3. `Bearer ` 뒤의 토큰 값을 추출.
4. 환경변수 `BACKEND_SHARED_SECRET`의 값과 **constant-time 비교**.
5. 일치하면 통과, 아니면 401.

### 공유 시크릿

- 환경변수명: `BACKEND_SHARED_SECRET`
- 값: 인프라/운영자가 안전한 채널(Slack DM 등)로 전달. 32바이트 hex.
- 백엔드 Azure 환경변수에 추가하고, 절대 로그에 남기지 마세요.

---

## 참고 구현

### Node.js / Express
```js
import crypto from 'node:crypto';

function adminAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const token = auth.slice('Bearer '.length);
  const expected = process.env.BACKEND_SHARED_SECRET;
  if (!expected) return res.status(500).json({ error: 'secret_missing' });
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

app.use('/api/admin/test', adminAuth);
```

### .NET (C#)
```csharp
public class AdminAuthMiddleware
{
    private readonly RequestDelegate _next;
    public AdminAuthMiddleware(RequestDelegate next) { _next = next; }

    public async Task Invoke(HttpContext ctx)
    {
        if (!ctx.Request.Path.StartsWithSegments("/api/admin/test"))
        {
            await _next(ctx);
            return;
        }
        var auth = ctx.Request.Headers["Authorization"].ToString();
        if (!auth.StartsWith("Bearer ", StringComparison.Ordinal))
        {
            ctx.Response.StatusCode = 401;
            return;
        }
        var token = auth.Substring("Bearer ".Length);
        var expected = Environment.GetEnvironmentVariable("BACKEND_SHARED_SECRET") ?? "";
        if (token.Length != expected.Length ||
            !System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(token),
                Encoding.UTF8.GetBytes(expected)))
        {
            ctx.Response.StatusCode = 401;
            return;
        }
        await _next(ctx);
    }
}
```

---

## 배포 순서

1. 백엔드 코드에 위 미들웨어 추가
2. Azure App Service Configuration에 `BACKEND_SHARED_SECRET` 추가
3. 백엔드 재배포
4. 어드민 도구 측에서 통합 테스트 (운영자가 진행)

> **주의**: 운영자에게 미리 알려주세요. 배포 직후엔 어드민 도구도 같은 시크릿을 사용하므로 자연스럽게 정상 작동해야 합니다. 만약 401이 뜨면 양쪽 시크릿 값을 다시 동기화하세요.

---

## 향후 비밀번호 회전 시

운영자가 어드민 도구의 비밀번호만 바꾸는 경우엔 시크릿이 그대로이므로 백엔드는 변경 불필요. 다만 시크릿까지 새로 발급하는 경우엔 새 값을 받아서 Azure env 갱신 후 백엔드 재배포가 필요합니다.

---

## 질문/이슈
프론트엔드 측 구현 코드:
- 프록시: `api/proxy/[...path].ts`
- 백엔드 호출 헬퍼: `api/_lib/backend.ts`
- 허용 경로 목록: `api/_lib/allowlist.ts`
