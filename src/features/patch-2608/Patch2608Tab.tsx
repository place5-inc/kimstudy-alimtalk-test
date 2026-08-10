import { useState } from "react";
import { MembershipLevelTab } from "./MembershipLevelTab";

const SUB_TABS = [
  { id: "membership-level", label: "멤버십 레벨 확인 및 수정", component: MembershipLevelTab },
] as const;

export function Patch2608Tab() {
  const [activeId, setActiveId] = useState<string>(SUB_TABS[0].id);
  const active = SUB_TABS.find((t) => t.id === activeId) ?? SUB_TABS[0];
  const ActiveComponent = active.component;

  return (
    <div>
      <div className="tab-header" role="tablist" aria-label="26.08월 패치 하위 탭">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeId === t.id}
            className={`tab-btn ${activeId === t.id ? "active" : ""}`}
            onClick={() => setActiveId(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ActiveComponent />
    </div>
  );
}
