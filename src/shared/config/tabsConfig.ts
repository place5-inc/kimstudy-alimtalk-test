import type { ComponentType } from 'react';
// import { ReviewCampaignTab } from '../../features/review-campaign/ReviewCampaignTab';
import { PassResetTab } from '../../features/pass-reset/PassResetTab';
import { SincerityDemotionTab } from '../../features/sincerity-demotion/SincerityDemotionTab';
import { Patch2606Tab } from '../../features/patch-2606/Patch2606Tab';
import { Patch2607Tab } from '../../features/patch-2607/Patch2607Tab';
import { AuthPhoneTab } from '../../features/auth-phone/authPhoneTab';
import { AlimtalkTab } from '../../features/alimtalk/AlimtalkTab';
import { CheckinAlimtalkTab } from '../../features/checkin-alimtalk/CheckinAlimtalkTab';
import { KimInstructorTestTab } from '../../features/kim-instructor-test/KimInstructorTestTab';
import { TutorBoostTab } from '../../features/tutor-boost/TutorBoostTab';
import { AlimtalkButtonUrlTab } from '../../features/alimtalk-button-url/AlimtalkButtonUrlTab';
import { Patch2608Tab } from '../../features/patch-2608/Patch2608Tab';
import { BannerStatusTab } from '../../features/banner-status/BannerStatusTab';

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
  // { id: 'review-campaign', label: '1. 후기확보캠페인', component: ReviewCampaignTab },
  { id: 'pass-reset', label: '1. PASS 인증 초기화', component: PassResetTab },
  { id: 'sincerity-demotion', label: '2. 성실등급강등 관련', component: SincerityDemotionTab },
  { id: 'patch-2608', label: '3. 26.08월 패치', component: Patch2608Tab },
  { id: 'patch-2606', label: '4. 26.06월 패치', component: Patch2606Tab },
  { id: 'patch-2607', label: '5. 26.07월 패치', component: Patch2607Tab },
  { id: 'auth-phone', label: '6. 인증번호 확인', component: AuthPhoneTab },
  { id: 'alimtalk', label: '7. 알림톡 발송', component: AlimtalkTab },
  { id: 'checkin-alimtalk', label: '8. 체크인 알림톡 발송', component: CheckinAlimtalkTab },
  { id: 'kim-instructor-test', label: '9. 김강사(테스트)', component: KimInstructorTestTab },
  { id: 'tutor-boost', label: '10. 선생님 부스트 디버그', component: TutorBoostTab },
  { id: 'alimtalk-button-url', label: '11. 알림톡 버튼 URL 확인', component: AlimtalkButtonUrlTab },
  { id: 'banner-status', label: '12. 배너 노출현황', component: BannerStatusTab },
];
