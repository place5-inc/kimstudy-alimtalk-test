import { useState } from 'react';
import { useAuth } from '../shared/auth/AuthProvider';
import { TABS } from '../shared/config/tabsConfig';
import { EnvProvider, useEnv, type AppEnv } from '../shared/config/EnvContext';

function EnvToggle() {
  const { env, setEnv } = useEnv();
  return (
    <div className="env-toggle-wrap">
      <span className="env-toggle-label">
        {env === 'test' ? '🟡 테스트 환경' : '🟢 운영 환경'}
      </span>
      <button
        type="button"
        className={`env-toggle-btn ${env === 'prod' ? 'env-toggle-btn--prod' : ''}`}
        onClick={() => setEnv((env === 'test' ? 'prod' : 'test') as AppEnv)}
        title={
          env === 'test'
            ? `현재: 테스트 (${new URL('https://dev-admin-api-cycndteybqbvbzc4.koreacentral-01.azurewebsites.net').host}) — 클릭하면 운영으로 전환`
            : `현재: 운영 (${new URL('https://adminapi.place5.com').host}) — 클릭하면 테스트로 전환`
        }
      >
        <span className="env-toggle-track">
          <span className="env-toggle-thumb" />
        </span>
        <span className="env-toggle-text">{env === 'test' ? '테스트' : '운영'}</span>
      </button>
    </div>
  );
}

function AdminPageInner() {
  const { logout } = useAuth();
  const [activeId, setActiveId] = useState<string>(TABS[0]?.id ?? '');

  const active = TABS.find((t) => t.id === activeId) ?? TABS[0];
  const ActiveComponent = active?.component;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-brand">김과외 어드민</span>
        <EnvToggle />
        <button
          type="button"
          className="app-logout"
          onClick={() => {
            void logout();
          }}
        >
          로그아웃
        </button>
      </header>

      <div className="tab-header" role="tablist" aria-label="어드민 기능">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            className={`tab-btn ${tab.id === activeId ? 'active' : ''}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">{ActiveComponent && <ActiveComponent />}</div>
    </div>
  );
}

export function AdminPage() {
  return (
    <EnvProvider>
      <AdminPageInner />
    </EnvProvider>
  );
}
