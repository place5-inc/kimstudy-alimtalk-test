import { useEffect, useState } from "react";
import { callProxy, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useEnv } from "../../shared/config/EnvContext";

interface BannerItem {
  id: number;
  mainTitle: string;
  subTitle: string;
  adminDescription: string | null;
  showOrder: number;
  conditionType: string | null;
  visiblePlatform: string;
}

interface RoleGroup {
  home?: BannerItem[];
  chat?: BannerItem[];
  tutorList?: BannerItem[];
  tuteeList?: BannerItem[];
  ranking?: BannerItem[];
  kimsuhaeng?: BannerItem;
}

interface BannerList {
  nonLogin: {
    web: { tutor: { tuteeList: BannerItem[] } };
  };
  login: {
    web: { parent: RoleGroup; tutee: RoleGroup; tutor: RoleGroup };
    app: { parent: RoleGroup; tutee: RoleGroup; tutor: RoleGroup };
  };
}

// 특정 배너 ID에 대한 커스텀 안내
const BANNER_CUSTOM_NOTES: Record<number, string> = {
  6: "소개서 완성 대작전 배너 — 문구는 선생님마다 변경됨",
  9: "소개서 완성 대작전 배너 — 문구는 선생님마다 변경됨",
  14: "소개서 완성 대작전 배너",
};

// adminDescription 을 숨길 배너 ID
const HIDE_ADMIN_DESC = new Set([3]);

// ─── 배너 카드 ────────────────────────────────────────────────────────────────
function BannerCard({ item, order }: { item: BannerItem; order: number }) {
  const customNote = BANNER_CUSTOM_NOTES[item.id];
  const showAdminDesc = !HIDE_ADMIN_DESC.has(item.id) && !!item.adminDescription;

  return (
    <div style={{ display: "flex", gap: 8, padding: "8px 10px", borderBottom: "1px solid #e2e8f0", alignItems: "flex-start" }}>
      <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: "#e2e8f0", color: "#4a5568", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
        {order}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1a202c", whiteSpace: "pre-line" }}>
          {item.mainTitle}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#718096" }}>{item.subTitle}</p>
        {showAdminDesc && (
          <p style={{ margin: "3px 0 0", fontSize: 10, color: "#b7791f", background: "rgba(255,200,0,0.1)", borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>
            ⚠️ {item.adminDescription}
          </p>
        )}
        {customNote && (
          <p style={{ margin: "3px 0 0", fontSize: 10, color: "#2b6cb0", background: "rgba(66,153,225,0.1)", borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>
            ℹ️ {customNote}
          </p>
        )}
      </div>
      <span style={{ flexShrink: 0, fontSize: 10, color: "#a0aec0", marginTop: 3, whiteSpace: "nowrap" }}>
        #{item.id}
        {item.visiblePlatform !== "all" && (
          <span style={{ marginLeft: 4, color: "#e53e3e" }}>[{item.visiblePlatform}]</span>
        )}
      </span>
    </div>
  );
}

// ─── 위치 그룹 ────────────────────────────────────────────────────────────────
function PositionGroup({ label, items }: { label: string; items?: BannerItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ margin: "0 0 0", fontSize: 10, fontWeight: 700, color: "#fff", background: "#718096", padding: "3px 8px", borderRadius: "4px 4px 0 0", display: "inline-block" }}>
        {label} ({items.length})
      </p>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: "0 4px 4px 4px", overflow: "hidden" }}>
        {items.map((item, i) => <BannerCard key={`${item.id}-${i}`} item={item} order={i + 1} />)}
      </div>
    </div>
  );
}

// ─── 단일 배너 (kimsuhaeng) ───────────────────────────────────────────────────
function SingleBannerGroup({ label, item }: { label: string; item?: BannerItem }) {
  if (!item) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ margin: "0 0 0", fontSize: 10, fontWeight: 700, color: "#fff", background: "#718096", padding: "3px 8px", borderRadius: "4px 4px 0 0", display: "inline-block" }}>
        {label}
      </p>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: "0 4px 4px 4px", overflow: "hidden" }}>
        <BannerCard item={item} order={1} />
      </div>
    </div>
  );
}

// ─── 역할 컬럼 ────────────────────────────────────────────────────────────────
function RoleColumn({ label, color, group, isTutor, showKimsuhaeng }: {
  label: string;
  color: string;
  group: RoleGroup;
  isTutor: boolean;
  showKimsuhaeng?: boolean;
}) {
  const listLabel = isTutor ? "학생찾기" : "선생님 목록";
  const listItems = isTutor ? group.tuteeList : group.tutorList;

  return (
    <div style={{ flex: 1, minWidth: 0, border: `2px solid ${color}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ background: color, padding: "6px 12px", color: "#fff", fontWeight: 700, fontSize: 13 }}>
        {label}
      </div>
      <div style={{ padding: "10px 10px 4px" }}>
        {showKimsuhaeng && <SingleBannerGroup label="김수행" item={group.kimsuhaeng} />}
        <PositionGroup label="홈 롤링배너" items={group.home} />
        <PositionGroup label={listLabel} items={listItems} />
        <PositionGroup label="채팅 랜덤배너" items={group.chat} />
        <PositionGroup label="랭킹" items={group.ranking} />
      </div>
    </div>
  );
}

// ─── 비로그인 컬럼 ────────────────────────────────────────────────────────────
function NonLoginColumn({ items }: { items: BannerItem[] }) {
  return (
    <div style={{ flex: 1, minWidth: 0, border: "2px solid #a0aec0", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ background: "#a0aec0", padding: "6px 12px", color: "#fff", fontWeight: 700, fontSize: 13 }}>
        비로그인
      </div>
      <div style={{ padding: "10px 10px 4px" }}>
        <PositionGroup label="학생찾기" items={items} />
      </div>
    </div>
  );
}

// ─── 메인 탭 ─────────────────────────────────────────────────────────────────
type ViewMode = "web" | "app";

export function BannerStatusTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerList, setBannerList] = useState<BannerList | null>(null);
  const [view, setView] = useState<ViewMode>("web");

  const { logout } = useAuth();
  const { env } = useEnv();

  useEffect(() => {
    async function fetchBanners() {
      setLoading(true);
      setError(null);
      try {
        const r = await callProxy("/admin/test/banner/list", {}, { env });
        if (r.ok) {
          const json = JSON.parse(r.body) as { isSuccess: boolean; bannerList: BannerList };
          setBannerList(json.bannerList);
        } else {
          setError(`실패 (${r.status}) ${r.body}`);
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setError(`오류: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setLoading(false);
      }
    }
    void fetchBanners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  const VIEW_TABS: { id: ViewMode; label: string }[] = [
    { id: "web", label: "🌐 웹" },
    { id: "app", label: "📱 앱" },
  ];

  return (
    <div>
      <p className="page-title">배너 노출현황</p>

      <div className="tab-header" role="tablist" aria-label="배너 플랫폼" style={{ marginBottom: 16 }}>
        {VIEW_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={view === t.id}
            className={`tab-btn ${view === t.id ? "active" : ""}`}
            onClick={() => setView(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "#718096", fontSize: 14, padding: "20px 0" }}>⏳ 배너 목록 불러오는 중...</p>}
      {error && <div className="result-box result-error" role="status">{error}</div>}

      {bannerList && (
        <>
          {view === "web" && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <NonLoginColumn items={bannerList.nonLogin.web.tutor.tuteeList} />
              <RoleColumn label="👨‍🏫 선생님" color="#276749" group={bannerList.login.web.tutor} isTutor={true} />
              <RoleColumn label="🧑‍🎓 학생" color="#2b6cb0" group={bannerList.login.web.tutee} isTutor={false} />
              <RoleColumn label="👨‍👩‍👧 학부모" color="#6b46c1" group={bannerList.login.web.parent} isTutor={false} />
            </div>
          )}

          {view === "app" && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <RoleColumn label="👨‍🏫 선생님" color="#276749" group={bannerList.login.app.tutor} isTutor={true} />
              <RoleColumn label="🧑‍🎓 학생" color="#2b6cb0" group={bannerList.login.app.tutee} isTutor={false} showKimsuhaeng />
              <RoleColumn label="👨‍👩‍👧 학부모" color="#6b46c1" group={bannerList.login.app.parent} isTutor={false} showKimsuhaeng />
            </div>
          )}
        </>
      )}
    </div>
  );
}
