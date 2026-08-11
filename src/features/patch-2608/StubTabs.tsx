function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <p className="page-title">{title}</p>
      <div className="section">
        <p style={{ fontSize: 14, color: "#718096" }}>🚧 준비 중입니다.</p>
      </div>
    </div>
  );
}



export function ChildBonusResetTab() {
  return <ComingSoon title="자녀 보너스 혜택 대상 초기화" />;
}

export function IntroCompleteQueueTab() {
  return <ComingSoon title="소개서 완성 큐" />;
}
