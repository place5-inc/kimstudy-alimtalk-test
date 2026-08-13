import { useState } from "react";
import { MembershipLevelTab } from "./MembershipLevelTab";
import { GenderChangeTab } from "./GenderChangeTab";
import { RecommendSubjectTab } from "./RecommendSubjectTab";
import { ChildBonusResetTab } from "./ChildBonusResetTab";
import { IntroCompleteQueueTab } from "./IntroCompleteQueueTab";

const SUB_TABS = [
  { id: "membership-level", label: "멤버십 레벨 확인 및 수정", component: MembershipLevelTab },
  { id: "gender-change", label: "성별 변경", component: GenderChangeTab },
  { id: "recommend-subject", label: "추천 과목 확인", component: RecommendSubjectTab },
  { id: "child-bonus-reset", label: "자녀 보너스 혜택 관련", component: ChildBonusResetTab },
  { id: "intro-complete-queue", label: "소개서 완성 큐", component: IntroCompleteQueueTab },
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
