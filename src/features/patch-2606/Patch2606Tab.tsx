import { useState } from "react";
import { MatchingTab } from "../matching/MatchingTab";
import { DemoTab } from "../matching/DemoTab";
import { DormantTab } from "../dormant/DormantTab";
import { EngagePopupTab } from "../engage-popup/EngagePopupTab";
import { RecoveryTab } from "../recovery/RecoveryTab";
import { ReviewTab } from "../review/ReviewTab";
import { FomoTab } from "../fomo/FomoTab";
import { QuickReplyTab } from "../quick-reply/QuickReplyTab";

const SUB_TABS = [
  { id: "matching", label: "성사누락", component: MatchingTab },
  { id: "demo", label: "시범전환", component: DemoTab },
  { id: "dormant", label: "휴면전환", component: DormantTab },
  { id: "engage-popup", label: "과외구함 팝업", component: EngagePopupTab },
  { id: "recovery", label: "이탈복구", component: RecoveryTab },
  { id: "review", label: "리뷰알림", component: ReviewTab },
  { id: "fomo", label: "FOMO", component: FomoTab },
  { id: "quick-reply", label: "간편답변 초기화", component: QuickReplyTab },
] as const;

export function Patch2606Tab() {
  const [activeId, setActiveId] = useState<string>(SUB_TABS[0].id);
  const active = SUB_TABS.find((t) => t.id === activeId) ?? SUB_TABS[0];
  const ActiveComponent = active.component;

  return (
    <div>
      <p className="page-title">26.06월 패치</p>

      <div className="tab-header" role="tablist" aria-label="26.06월 패치 기능">
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
