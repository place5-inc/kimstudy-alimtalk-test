import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../shared/auth/AuthProvider';
import { GROUPS, findFeature } from '../shared/config/groupsConfig';
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

function HomeScreen({ onNavigate }: { onNavigate: (featureId: string) => void }) {
  return (
    <div className="home-wrap">
    <div className="home-screen">
      <div className="home-header">
        <h1 className="home-title">김과외 어드민</h1>
        <p className="home-subtitle">기능을 선택해 시작하세요</p>
      </div>
      <div className="home-grid">
        {GROUPS.map((group) => (
          <div key={group.id} className="home-group-row">
            <div className="home-group-name">{group.label}</div>
            <div className="home-group-features">
              {group.features.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  className="home-feature-btn"
                  onClick={() => onNavigate(feature.id)}
                >
                  {feature.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

function TopNav({
  activeFeatureId,
  onNavigate,
  onHome,
}: {
  activeFeatureId: string;
  onNavigate: (featureId: string) => void;
  onHome: () => void;
}) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const activeResult = findFeature(activeFeatureId);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroupId(null);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <nav ref={navRef} className="top-nav">
      <button type="button" className="top-nav-home" onClick={onHome}>
        ← 홈
      </button>
      <div className="top-nav-groups">
        {GROUPS.map((group) => {
          const isActiveGroup = activeResult?.group.id === group.id;
          const isOpen = openGroupId === group.id;
          return (
            <div
              key={group.id}
              className={`top-nav-group ${isActiveGroup ? 'active' : ''} ${isOpen ? 'open' : ''}`}
            >
              <button
                type="button"
                className="top-nav-group-btn"
                onClick={() => setOpenGroupId(isOpen ? null : group.id)}
              >
                {group.label}
                <span className="top-nav-caret">▾</span>
              </button>
              {isOpen && (
                <div className="top-nav-dropdown">
                  {group.features.map((feature) => (
                    <button
                      key={feature.id}
                      type="button"
                      className={`top-nav-dropdown-item ${feature.id === activeFeatureId ? 'active' : ''}`}
                      onClick={() => {
                        onNavigate(feature.id);
                        setOpenGroupId(null);
                      }}
                    >
                      {feature.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function AdminPageInner() {
  const { logout } = useAuth();
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);

  const activeResult = activeFeatureId ? findFeature(activeFeatureId) : null;
  const ActiveComponent = activeResult?.feature.component;

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="app-brand"
          onClick={() => setActiveFeatureId(null)}
        >
          김과외 어드민
        </button>
        <EnvToggle />
        <button
          type="button"
          className="app-logout"
          onClick={() => { void logout(); }}
        >
          로그아웃
        </button>
      </header>

      {activeFeatureId === null ? (
        <HomeScreen onNavigate={setActiveFeatureId} />
      ) : (
        <>
          <TopNav
            activeFeatureId={activeFeatureId}
            onNavigate={setActiveFeatureId}
            onHome={() => setActiveFeatureId(null)}
          />
          {activeResult && (
            <div className="breadcrumb">
              {activeResult.group.features.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`breadcrumb-sibling-btn ${f.id === activeFeatureId ? 'current' : ''}`}
                  onClick={() => setActiveFeatureId(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
          <div className="tab-content">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </>
      )}
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
