import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/auth/AuthProvider';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(password);
      const from = (location.state as LocationState | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'too_many_attempts') {
        setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else if (msg === 'invalid_credentials') {
        setError('비밀번호가 올바르지 않습니다.');
      } else if (msg === 'server_misconfigured') {
        setError('서버 설정 오류입니다. 운영자에게 문의해주세요.');
      } else {
        setError('로그인에 실패했습니다.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <p className="login-title">김과외 어드민</p>
        <p className="login-subtitle">테스트 도구입니다. 비밀번호를 입력해주세요.</p>
        <div className="field">
          <label htmlFor="password">
            비밀번호 <span className="required">*</span>
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            disabled={busy}
          />
        </div>
        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? '확인 중...' : '로그인'}
        </button>
        {error && (
          <div className="result-box result-error" style={{ marginTop: 12 }} role="alert">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
