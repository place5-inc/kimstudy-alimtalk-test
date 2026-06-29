import { useState } from "react";
import { JoinHistoryResetTab } from "./JoinHistoryResetTab";
import { PostDeleteTab } from "./PostDeleteTab";
import { AccountRecoveryTab } from "./AccountRecoveryTab";
import { PassAuthTab } from "./PassAuthTab";

const SUB_TABS = [
  { id: "join-history-reset", label: "가입 이력 해제", component: JoinHistoryResetTab },
  { id: "post-delete", label: "공고 삭제", component: PostDeleteTab },
  { id: "account-recovery", label: "계정 복구", component: AccountRecoveryTab },
  { id: "pass-auth", label: "패스 인증처리", component: PassAuthTab },
] as const;

export function KimInstructorTestTab() {
  const [activeId, setActiveId] = useState<string>(SUB_TABS[0].id);
  const active = SUB_TABS.find((t) => t.id === activeId) ?? SUB_TABS[0];
  const ActiveComponent = active.component;

  return (
    <div>
      <p className="page-title">김강사(테스트)</p>

      <div className="tab-header" role="tablist" aria-label="김강사(테스트) 기능">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            className={`tab-btn ${tab.id === activeId ? "active" : ""}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
}
