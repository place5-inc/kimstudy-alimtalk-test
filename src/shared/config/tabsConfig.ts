import type { ComponentType } from 'react';
import { ReviewCampaignTab } from '../../features/review-campaign/ReviewCampaignTab';
import { PassResetTab } from '../../features/pass-reset/PassResetTab';
import { MatchingTab } from '../../features/matching/MatchingTab';
import { DemoTab } from '../../features/matching/DemoTab';
import { DormantTab } from '../../features/dormant/DormantTab';
import { EngagePopupTab } from '../../features/engage-popup/EngagePopupTab';
import { RecoveryTab } from '../../features/recovery/RecoveryTab';
import { ReviewTab } from '../../features/review/ReviewTab';
import { FomoTab } from '../../features/fomo/FomoTab';
import { QuickReplyTab } from '../../features/quick-reply/QuickReplyTab';
import { AuthPhoneTab } from '../../features/auth-phone/authPhoneTab';
import { AlimtalkTab } from '../../features/alimtalk/AlimtalkTab';
import { CheckinAlimtalkTab } from '../../features/checkin-alimtalk/CheckinAlimtalkTab';

export interface TabConfig {
  id: string;
  label: string;
  component: ComponentType;
}

/**
 * 새 어드민 탭을 추가하려면:
 *   1. src/features/<my-feature>/MyTab.tsx 컴포넌트 작성
 *   2. 이 배열에 { id, label, component } 추가
 *   3. api/_lib/allowlist.ts 에 백엔드 경로 정규식 등록
 */
export const TABS: readonly TabConfig[] = [
  { id: 'review-campaign', label: '1. 후기확보캠페인', component: ReviewCampaignTab },
  { id: 'pass-reset', label: '2. PASS 인증 초기화', component: PassResetTab },
  { id: 'matching', label: '3. 성사누락', component: MatchingTab },
  { id: 'demo', label: '4. 시범전환', component: DemoTab },
  { id: 'dormant', label: '5. 휴면전환', component: DormantTab },
  { id: 'engage-popup', label: '6. 과외구함 팝업', component: EngagePopupTab },
  { id: 'recovery', label: '7. 이탈복구', component: RecoveryTab },
  { id: 'review', label: '8. 리뷰알림', component: ReviewTab },
  { id: 'fomo', label: '9. FOMO', component: FomoTab },
  { id: 'quick-reply', label: '10. 간편답변 초기화', component: QuickReplyTab },
  { id: 'auth-phone', label: '11. 인증번호 확인', component: AuthPhoneTab },
  { id: 'alimtalk', label: '12. 알림톡 발송', component: AlimtalkTab },
  { id: 'checkin-alimtalk', label: '13. 체크인 알림톡 발송', component: CheckinAlimtalkTab },
];
