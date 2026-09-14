function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ padding: '3rem 1.5rem', color: '#bbb', fontSize: 14 }}>
      {label} — 준비중입니다
    </div>
  );
}

export function ComingSoon2() {
  return <ComingSoon label="준비중2" />;
}

export function OverseasIdentityVerifyTab() {
  return <ComingSoon label="신원인증완료처리" />;
}

export function OverseasIdentityResetTab() {
  return <ComingSoon label="신원인증초기화" />;
}

export function OverseasNationalityChangeTab() {
  return <ComingSoon label="국적변경" />;
}
