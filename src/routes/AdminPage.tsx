import { useState } from 'react';
import { useAuth } from '../shared/auth/AuthProvider';
import { TABS } from '../shared/config/tabsConfig';

export function AdminPage() {
  const { logout } = useAuth();
  const [activeId, setActiveId] = useState<string>(TABS[0]?.id ?? '');

  const active = TABS.find((t) => t.id === activeId) ?? TABS[0];
  const ActiveComponent = active?.component;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-brand">김과외 어드민</span>
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
