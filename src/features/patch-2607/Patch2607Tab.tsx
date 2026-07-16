import { useState } from "react";
import { PassPredictAlimtalkTab } from "./PassPredictAlimtalkTab";
import { BudgetPopupResetTab } from "./BudgetPopupResetTab";
import { TutorReturnAlimtalkTab } from "./TutorReturnAlimtalkTab";
import { Noti99V2AlimtalkTab } from "./Noti99V2AlimtalkTab";

const SUB_TABS = [
  { id: "pass-predict-alimtalk", label: "합격예측기 알림톡 발송", component: PassPredictAlimtalkTab },
  { id: "budget-popup-reset", label: "예산상향팝업응답초기화", component: BudgetPopupResetTab },
  { id: "tutor-return-alimtalk", label: "이탈선생님복귀유도알림톡 발송", component: TutorReturnAlimtalkTab },
  { id: "noti99-v2-alimtalk", label: "noti99_v2알림톡 발송", component: Noti99V2AlimtalkTab },
] as const;

export function Patch2607Tab() {
  const [activeId, setActiveId] = useState<string>(SUB_TABS[0].id);
  const active = SUB_TABS.find((t) => t.id === activeId) ?? SUB_TABS[0];
  const ActiveComponent = active.component;

  return (
    <div>
      <p className="page-title">26.07월 패치</p>

      <div className="tab-header" role="tablist" aria-label="26.07월 패치 기능">
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
