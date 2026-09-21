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

export function AbroadNicknameConvertTab() {
  return <ComingSoon label="선생님닉네임변환" />;
}

export function SuhaengComingSoon1() {
  return <ComingSoon label="준비중1" />;
}

export function AbroadTutorTranslateTab() {
  return <ComingSoon label="소개서번역" />;
}
