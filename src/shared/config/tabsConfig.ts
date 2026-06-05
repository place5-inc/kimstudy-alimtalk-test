import type { ComponentType } from 'react';
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
  { id: 'matching', label: '1. 성사누락', component: MatchingTab },
  { id: 'demo', label: '2. 시범전환', component: DemoTab },
  { id: 'dormant', label: '3. 휴면전환', component: DormantTab },
  { id: 'engage-popup', label: '4. 과외구함 팝업', component: EngagePopupTab },
  { id: 'recovery', label: '5. 이탈복구', component: RecoveryTab },
  { id: 'review', label: '6. 리뷰알림', component: ReviewTab },
  { id: 'fomo', label: '7. FOMO', component: FomoTab },
  { id: 'quick-reply', label: '8. 간편답변 초기화', component: QuickReplyTab },
  { id: 'auth-phone', label: '9. 인증번호 확인', component: AuthPhoneTab },
  { id: 'alimtalk', label: '10. 알림톡 발송', component: AlimtalkTab },
  { id: 'checkin-alimtalk', label: '11. 체크인 알림톡 발송', component: CheckinAlimtalkTab },
];
