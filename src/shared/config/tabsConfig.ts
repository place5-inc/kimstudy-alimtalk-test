import type { ComponentType } from 'react';
import { ReviewCampaignTab } from '../../features/review-campaign/ReviewCampaignTab';
import { PassResetTab } from '../../features/pass-reset/PassResetTab';
import { SincerityDemotionTab } from '../../features/sincerity-demotion/SincerityDemotionTab';
import { Patch2606Tab } from '../../features/patch-2606/Patch2606Tab';
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
  { id: 'sincerity-demotion', label: '3. 성실등급강등 관련', component: SincerityDemotionTab },
  { id: 'patch-2606', label: '4. 26.06월 패치', component: Patch2606Tab },
  { id: 'auth-phone', label: '5. 인증번호 확인', component: AuthPhoneTab },
  { id: 'alimtalk', label: '6. 알림톡 발송', component: AlimtalkTab },
  { id: 'checkin-alimtalk', label: '7. 체크인 알림톡 발송', component: CheckinAlimtalkTab },
];
