import type { ComponentType } from 'react';
import { OverseasIdentityVerifyTab, OverseasIdentityResetTab, OverseasNationalityChangeTab } from '../../features/overseas/OverseasNicknameActionTab';
import { OverseasSendEmailTab } from '../../features/overseas/OverseasSendEmailTab';
import { OverseasAuthPhoneTab } from '../../features/overseas/OverseasAuthPhoneTab';
import { PassResetTab } from '../../features/pass-reset/PassResetTab';
import { SincerityDemotionTab } from '../../features/sincerity-demotion/SincerityDemotionTab';
import { AuthPhoneTab } from '../../features/auth-phone/authPhoneTab';
import { DormantTab } from '../../features/dormant/DormantTab';
import { MembershipLevelTab } from '../../features/patch-2608/MembershipLevelTab';
import { GenderChangeTab } from '../../features/patch-2608/GenderChangeTab';
import { SignupFunnelLogTab } from '../../features/patch-2608/SignupFunnelLogTab';
import { EngagePopupTab } from '../../features/engage-popup/EngagePopupTab';
import { BudgetPopupResetTab } from '../../features/patch-2607/BudgetPopupResetTab';
import { AcademyLawPopupTab } from '../../features/patch-2607/AcademyLawPopupTab';
import { CurationPopupResetTab } from '../../features/patch-2608/CurationPopupResetTab';
import { QuickReplyTab } from '../../features/quick-reply/QuickReplyTab';
import { CloneRequestTab } from '../../features/patch-2607/CloneRequestTab';
import { LessonRequestDateTab } from '../../features/patch-2607/LessonRequestDateTab';
import { RecommendSubjectTab } from '../../features/patch-2608/RecommendSubjectTab';
import { ChildBonusResetTab } from '../../features/patch-2608/ChildBonusResetTab';
import { IntroCompleteQueueTab } from '../../features/patch-2608/IntroCompleteQueueTab';
import { MultiProfileResetTab } from '../../features/patch-2608/MultiProfileResetTab';
import { MultiLanguageTab } from '../../features/patch-2608/MultiLanguageTab';
import { BannerStatusTab } from '../../features/banner-status/BannerStatusTab';
import { AlimtalkTab } from '../../features/alimtalk/AlimtalkTab';
import { CheckinAlimtalkTab } from '../../features/checkin-alimtalk/CheckinAlimtalkTab';
import { AlimtalkButtonUrlTab } from '../../features/alimtalk-button-url/AlimtalkButtonUrlTab';
import { MatchingTab } from '../../features/matching/MatchingTab';
import { DemoTab } from '../../features/matching/DemoTab';
import { TutorReturnAlimtalkTab } from '../../features/patch-2607/TutorReturnAlimtalkTab';
import { Noti99V2AlimtalkTab } from '../../features/patch-2607/Noti99V2AlimtalkTab';
import { RecoveryTab } from '../../features/recovery/RecoveryTab';
import { ReviewTab } from '../../features/review/ReviewTab';
import { FomoTab } from '../../features/fomo/FomoTab';
import { JoinHistoryResetTab } from '../../features/kim-instructor-test/JoinHistoryResetTab';
import { PostDeleteTab } from '../../features/kim-instructor-test/PostDeleteTab';
import { AccountRecoveryTab } from '../../features/kim-instructor-test/AccountRecoveryTab';
import { PassAuthTab } from '../../features/kim-instructor-test/PassAuthTab';
import { AcademyRequirementResetTab } from '../../features/patch-2607/AcademyRequirementResetTab';
import { ApplyChatResetTab } from '../../features/patch-2607/ApplyChatResetTab';
import { TutorBoostTab } from '../../features/tutor-boost/TutorBoostTab';
import { PassPredictAlimtalkTab } from '../../features/patch-2607/PassPredictAlimtalkTab';
import { PassPredictorResetTab } from '../../features/patch-2607/PassPredictorResetTab';
import { PassPredictorUpdateDayTab } from '../../features/patch-2607/PassPredictorUpdateDayTab';
import { PassPredictorCouponTab } from '../../features/patch-2607/PassPredictorCouponTab';

export interface FeatureConfig {
  id: string;
  label: string;
  component: ComponentType;
}

export interface GroupConfig {
  id: string;
  label: string;
  badge?: string;
  features: readonly FeatureConfig[];
}

export const GROUPS: readonly GroupConfig[] = [
  {
    id: 'abroad',
    label: '해외개방',
    badge: 'new',
    features: [
      { id: 'auth-phone', label: '인증번호 확인', component: OverseasAuthPhoneTab },
      { id: 'auth-user', label: '신원인증완료처리', component: OverseasIdentityVerifyTab },
      { id: 'auth-reset', label: '신원인증초기화', component: OverseasIdentityResetTab },
      { id: 'nationality', label: '국적변경', component: OverseasNationalityChangeTab },
      { id: 'send-email', label: '이메일발송', component: OverseasSendEmailTab },
    ],
  },
  {
    id: 'account',
    label: '계정 상태 관리',
    features: [
      { id: 'pass-reset', label: 'PASS 인증 초기화', component: PassResetTab },
      { id: 'degrade-black', label: '성실등급강등', component: SincerityDemotionTab },
      { id: 'auth-phone', label: '인증번호 확인', component: AuthPhoneTab },
      { id: 'dormant', label: '휴면전환', component: DormantTab },
      { id: 'membership-level', label: '멤버십 레벨', component: MembershipLevelTab },
      { id: 'gender-change', label: '성별 변경', component: GenderChangeTab },
      { id: 'signup-funnel-log', label: '가입이탈기록로그', component: SignupFunnelLogTab },
    ],
  },
  {
    id: 'popup',
    label: '팝업 관련',
    features: [
      { id: 'engage-popup', label: '과외구함 팝업', component: EngagePopupTab },
      { id: 'budget-popup-reset', label: '예산상향팝업 초기화', component: BudgetPopupResetTab },
      { id: 'academy-law-popup', label: '학원법 팝업', component: AcademyLawPopupTab },
      { id: 'curation-popup-reset', label: '특별관 팝업 초기화', component: CurationPopupResetTab },
    ],
  },
  {
    id: 'recruit',
    label: '모집공고/채팅',
    features: [
      { id: 'quick-reply', label: '간편답변 초기화', component: QuickReplyTab },
      { id: 'clone-request', label: '모집공고 복제', component: CloneRequestTab },
      { id: 'lesson-request-date', label: '모집공고 날짜 수정', component: LessonRequestDateTab },
      { id: 'recommend-subject', label: '추천 과목 확인', component: RecommendSubjectTab },
      { id: 'child-bonus-benefit', label: '자녀 보너스 혜택', component: ChildBonusResetTab },
    ],
  },
  {
    id: 'profile',
    label: '선생님 소개서',
    features: [
      { id: 'completion-queue', label: '소개서 완성 큐', component: IntroCompleteQueueTab },
      { id: 'multi-profile-reset', label: '멀티소개서 초기화', component: MultiProfileResetTab },
      { id: 'multi-language', label: '다국어번역', component: MultiLanguageTab },
    ],
  },
  {
    id: 'banner',
    label: '배너 노출현황',
    features: [
      { id: 'banner-status', label: '배너 노출현황', component: BannerStatusTab },
    ],
  },
  {
    id: 'alimtalk',
    label: '알림톡',
    features: [
      { id: 'send', label: '알림톡 발송', component: AlimtalkTab },
      { id: 'checkin', label: '체크인 알림톡', component: CheckinAlimtalkTab },
      { id: 'button-url', label: '버튼 URL 확인', component: AlimtalkButtonUrlTab },
      { id: 'check-matching', label: '성사누락', component: MatchingTab },
      { id: 'demo', label: '시범전환', component: DemoTab },
      { id: 'tutor-return', label: '선생님복귀 알림톡', component: TutorReturnAlimtalkTab },
      { id: 'noti99_v2', label: 'noti99_v2 알림톡', component: Noti99V2AlimtalkTab },
    ],
  },
  {
    id: 'push',
    label: '푸시 발송',
    features: [
      { id: 'recovery', label: '이탈복구', component: RecoveryTab },
      { id: 'review', label: '리뷰알림', component: ReviewTab },
      { id: 'fomo', label: 'FOMO', component: FomoTab },
    ],
  },
  {
    id: 'kimacademy',
    label: '김강사',
    features: [
      { id: 'signup-reset', label: '가입 이력 해제', component: JoinHistoryResetTab },
      { id: 'jobOffer-delete', label: '공고 삭제', component: PostDeleteTab },
      { id: 'account-recovery', label: '계정 복구', component: AccountRecoveryTab },
      { id: 'pass-auth', label: '패스 인증처리', component: PassAuthTab },
      { id: 'requirement-popup-reset', label: '채용제안 팝업 초기화', component: AcademyRequirementResetTab },
      { id: 'apply-chat-reset', label: '제안·채팅 초기화', component: ApplyChatResetTab },
    ],
  },
  {
    id: 'boost',
    label: '선생님 부스트',
    features: [
      { id: 'tutor-boost', label: '부스트 디버그', component: TutorBoostTab },
    ],
  },
  {
    id: 'pass-predictor',
    label: '합격예측기',
    features: [
      { id: 'kakao', label: '알림톡 발송', component: PassPredictAlimtalkTab },
      { id: 'reset', label: '기록 초기화', component: PassPredictorResetTab },
      { id: 'update-day', label: '수정일 100일전 변경', component: PassPredictorUpdateDayTab },
      { id: 'add-coupon', label: '쿠폰 추가', component: PassPredictorCouponTab },
    ],
  },
];

export function findFeature(featureId: string, groupId?: string): { group: GroupConfig; feature: FeatureConfig } | null {
  for (const group of GROUPS) {
    if (groupId && group.id !== groupId) continue;
    const feature = group.features.find((f) => f.id === featureId);
    if (feature) return { group, feature };
  }
  return null;
}
