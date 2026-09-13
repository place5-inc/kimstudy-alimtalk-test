export function ComingSoon1() {
  return <ComingSoon label="준비중1" />;
}

export function ComingSoon2() {
  return <ComingSoon label="준비중2" />;
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ padding: '3rem 1.5rem', color: '#bbb', fontSize: 14 }}>
      {label} — 준비중입니다
    </div>
  );
}
