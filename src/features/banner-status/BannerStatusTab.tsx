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

// ─── 배너 카드 ───────────────────────────────────────────────────────────────
function BannerCard({ item, order }: { item: BannerItem; order: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 12px",
        borderBottom: "1px solid #e2e8f0",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#e2e8f0",
          color: "#4a5568",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {order}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1a202c" }}>
          {item.mainTitle}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#718096" }}>
          {item.subTitle}
        </p>
        {item.adminDescription && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 11,
              color: "#b7791f",
              background: "rgba(255,200,0,0.1)",
              borderRadius: 4,
              padding: "2px 6px",
              display: "inline-block",
            }}
          >
            ⚠️ {item.adminDescription}
          </p>
        )}
      </div>
      <span
        style={{
          flexShrink: 0,
          fontSize: 10,
          color: "#a0aec0",
          marginTop: 4,
          whiteSpace: "nowrap",
        }}
      >
        #{item.id}
        {item.visiblePlatform !== "all" && (
          <span style={{ marginLeft: 4, color: "#e53e3e" }}>
            [{item.visiblePlatform}]
          </span>
        )}
      </span>
    </div>
  );
}

// ─── 위치 그룹 ───────────────────────────────────────────────────────────────
function PositionGroup({
  label,
  items,
}: {
  label: string;
  items: BannerItem[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <p
        style={{
          margin: "0 0 0",
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          background: "#4a5568",
          padding: "4px 10px",
          borderRadius: "6px 6px 0 0",
          display: "inline-block",
        }}
      >
        {label} ({items.length}개)
      </p>
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "0 6px 6px 6px",
          overflow: "hidden",
        }}
      >
        {items.map((item, i) => (
          <BannerCard key={item.id + "-" + i} item={item} order={i + 1} />
        ))}
      </div>
    </div>
  );
}

// ─── 역할 섹션 ───────────────────────────────────────────────────────────────
function RoleSection({
  roleLabel,
  color,
  group,
  isTutor,
}: {
  roleLabel: string;
  color: string;
  group: RoleGroup;
  isTutor: boolean;
}) {
  const listLabel = isTutor ? "학생찾기" : "선생님 목록";
  const listItems = isTutor ? group.tuteeList : group.tutorList;

  return (
    <div
      style={{
        border: `2px solid ${color}`,
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          background: color,
          padding: "8px 14px",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {roleLabel}
      </div>
      <div style={{ padding: "12px 12px 4px" }}>
        <PositionGroup label="홈화면 - 롤링배너" items={group.home ?? []} />
        <PositionGroup label={listLabel} items={listItems ?? []} />
        <PositionGroup label="채팅 - 랜덤배너" items={group.chat ?? []} />
      </div>
    </div>
  );
}

// ─── 플랫폼 블록 ─────────────────────────────────────────────────────────────
function PlatformBlock({
  platform,
}: {
  platform: { parent: RoleGroup; tutee: RoleGroup; tutor: RoleGroup };
}) {
  return (
    <>
      <RoleSection roleLabel="👨‍👩‍👧 학부모" color="#6b46c1" group={platform.parent} isTutor={false} />
      <RoleSection roleLabel="🧑‍🎓 학생(tutee)" color="#2b6cb0" group={platform.tutee} isTutor={false} />
      <RoleSection roleLabel="👨‍🏫 선생님(tutor)" color="#276749" group={platform.tutor} isTutor={true} />
    </>
  );
}

// ─── 메인 탭 ────────────────────────────────────────────────────────────────
type ViewMode = "nonLogin" | "loginWeb" | "loginApp";

export function BannerStatusTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerList, setBannerList] = useState<BannerList | null>(null);
  const [view, setView] = useState<ViewMode>("nonLogin");

  const { logout } = useAuth();
  const { env } = useEnv();

  useEffect(() => {
    async function fetchBanners() {
      setLoading(true);
      setError(null);
      try {
        const r = await callProxy("/admin/test/banner/list", {}, { env });
        if (r.ok) {
          const json = JSON.parse(r.body) as {
            isSuccess: boolean;
            bannerList: BannerList;
          };
          setBannerList(json.bannerList);
        } else {
          setError(`실패 (${r.status}) ${r.body}`);
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) {
          await logout();
          return;
        }
        setError(`오류: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setLoading(false);
      }
    }
    void fetchBanners();
  // env가 바뀌면 재조회
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  const VIEW_TABS: { id: ViewMode; label: string }[] = [
    { id: "nonLogin", label: "① 비로그인(웹)" },
    { id: "loginWeb", label: "② 로그인(웹)" },
    { id: "loginApp", label: "③ 로그인(앱)" },
  ];

  return (
    <div>
      <p className="page-title">배너 노출현황</p>
      <p className="page-subtitle">
        현재 노출 중인 배너 목록을 조회합니다. 환경 토글(테스트/운영)에 따라 데이터가 달라집니다.
      </p>

      {/* 뷰 선택 */}
      <div className="tab-header" role="tablist" aria-label="배너 노출 구분" style={{ marginBottom: 16 }}>
        {VIEW_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={view === t.id}
            className={`tab-btn ${view === t.id ? "active" : ""}`}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: "#718096", fontSize: 14, padding: "20px 0" }}>
          ⏳ 배너 목록 불러오는 중...
        </p>
      )}

      {error && (
        <div className="result-box result-error" role="status">
          {error}
        </div>
      )}

      {bannerList && (
        <>
          {view === "nonLogin" && (
            <div>
              <p style={{ fontSize: 13, color: "#4a5568", marginBottom: 12, fontWeight: 600 }}>
                🌐 비로그인 웹 — 학생찾기(tuteeList)
              </p>
              <PositionGroup
                label="학생찾기"
                items={bannerList.nonLogin.web.tutor.tuteeList}
              />
            </div>
          )}

          {view === "loginWeb" && (
            <PlatformBlock platform={bannerList.login.web} />
          )}

          {view === "loginApp" && (
            <PlatformBlock platform={bannerList.login.app} />
          )}
        </>
      )}
    </div>
  );
}
