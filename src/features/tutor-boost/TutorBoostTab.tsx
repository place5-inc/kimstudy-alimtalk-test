import { useState, type CSSProperties } from 'react';
import { callProxy, fetchConfirmToken } from '../../shared/api/client';
import { ResultBox, type ResultState } from '../../shared/ui/ResultBox';

// 신호 코드 → 한글 라벨
const SIGNAL_LABEL: Record<string, string> = {
  MAJOR: '전공',
  HIGH_SCHOOL: '출신고교',
  PRESTIGE_UNIV: '명문대',
  STUDY_ABROAD: '유학·해외거주',
  CERT: '자격증',
  LANG_SCORE: '어학성적',
  FOREIGN_UNIV: '해외대학',
  GRADUATION: '졸업여부',
  SIMILAR_SUBJECT: '유사과목(수업중)',
  PASS_NOTE: '합격수기',
  GIFTED: '영재원',
};
const sigLabel = (s: string) => SIGNAL_LABEL[s] ?? s;

interface Candidate {
  userId: string;
  nickname?: string | null;
  phoneNumber?: string | null;
  userRole?: string | null;
}
interface DebugSubject {
  subjectId: string;
  name?: string | null;
  matchedSignals: string[];
}
interface Profile {
  major?: string | null;
  university?: string | null;
  highSchool?: string | null;
  attendingState?: string | null;
  campusCountryCode?: string | null;
  studyAbroadNations: string[];
  giftedNames: string[];
  licenses: string[];
  langSkills: string[];
  passNoteCategoryIds: number[];
  taughtSubjectCount: number;
}
interface DebugVO {
  tutorId: string;
  tutorFound: boolean;
  addOnlineClass?: boolean | null;
  lessonCountMultiplier?: string | null;
  lastShownAt?: string | null;
  inCooldown: boolean;
  activeRuleCount: number;
  profile?: Profile | null;
  recommendedSubjects: DebugSubject[];
}

function parseBody<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

const cell: CSSProperties = { border: '1px solid #ddd', padding: '6px 8px', fontSize: 13 };
const chips = (items: string[]) =>
  items.length ? items.map((t, i) => (
    <span key={`${t}-${i}`} className="badge" style={{ marginRight: 4 }}>
      {t}
    </span>
  )) : '-';

export function TutorBoostTab() {
  const [keyword, setKeyword] = useState('');
  const [userId, setUserId] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [debug, setDebug] = useState<DebugVO | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const search = async () => {
    if (!keyword.trim()) {
      setResult({ ok: false, message: '닉네임 또는 전화번호를 입력하세요.' });
      return;
    }
    setResult(null);
    const r = await callProxy('/admin/test/boost/search', { keyword: keyword.trim() });
    const j = parseBody<{ isSuccess: boolean; systemMessage?: string; list: Candidate[] }>(r.body);
    if (j?.isSuccess) {
      setCandidates(j.list ?? []);
      if (!j.list?.length) setResult({ ok: false, message: '검색 결과가 없습니다.' });
    } else {
      setResult({ ok: false, message: j?.systemMessage ?? `검색 실패 (${r.status})` });
    }
  };

  const fetchDebug = async (id?: string) => {
    const uid = (id ?? userId).trim();
    if (!uid) {
      setResult({ ok: false, message: 'userId를 입력하세요.' });
      return;
    }
    setLoading(true);
    setDebug(null);
    setResult(null);
    try {
      const r = await callProxy('/admin/test/boost/debug', { userId: uid });
      const j = parseBody<{ isSuccess: boolean; systemMessage?: string; debug: DebugVO }>(r.body);
      if (j?.isSuccess) setDebug(j.debug);
      else setResult({ ok: false, message: j?.systemMessage ?? `조회 실패 (${r.status})` });
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (c: Candidate) => {
    setUserId(c.userId);
    setCandidates([]);
    fetchDebug(c.userId);
  };

  const resetCooldown = async () => {
    const uid = userId.trim();
    if (!uid) return;
    if (!window.confirm('이 선생님의 30일 노출 쿨다운을 초기화할까요?')) return;
    try {
      const token = await fetchConfirmToken('boost:reset');
      const r = await callProxy('/admin/test/boost/reset', { userId: uid }, { confirmToken: token });
      const j = parseBody<{ isSuccess: boolean; systemMessage?: string; deletedCount: number }>(r.body);
      if (j?.isSuccess) {
        setResult({ ok: true, message: `쿨다운 초기화 완료 (${j.deletedCount}건 삭제)` });
        fetchDebug(uid);
      } else {
        setResult({ ok: false, message: j?.systemMessage ?? `초기화 실패 (${r.status})` });
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : '초기화 실패' });
    }
  };

  return (
    <div>
      <p className="page-title">선생님 부스트 디버그</p>
      <p className="page-subtitle">
        userId(=tutorId) 또는 닉네임/전화번호로 선생님을 찾아, 추천과목 신호·결과를 확인하고 30일 쿨다운을 초기화합니다.
      </p>

      {/* 검색/조회 */}
      <div className="section">
        <div className="field">
          <label>닉네임/전화 검색</label>
          <div className="row">
            <input
              type="text"
              placeholder="닉네임 또는 전화번호"
              autoComplete="off"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button className="btn btn-ghost" type="button" onClick={search}>
              검색
            </button>
          </div>
        </div>
        <div className="field">
          <label>userId (= tutorId)</label>
          <div className="row">
            <input
              type="text"
              placeholder="userId 직접 입력"
              autoComplete="off"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <button className="btn btn-send" type="button" onClick={() => fetchDebug()}>
              결과 조회
            </button>
            <button className="btn btn-reset" type="button" onClick={resetCooldown}>
              30일 쿨다운 초기화
            </button>
          </div>
        </div>
      </div>

      <ResultBox result={result} />

      {/* 검색 후보 */}
      {candidates.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 12 }}>
          <thead>
            <tr>
              <th style={cell}>닉네임</th>
              <th style={cell}>전화번호</th>
              <th style={cell}>역할</th>
              <th style={cell}>userId</th>
              <th style={cell}>선택</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.userId}>
                <td style={cell}>{c.nickname ?? '-'}</td>
                <td style={cell}>{c.phoneNumber ?? '-'}</td>
                <td style={cell}>{c.userRole ?? '-'}</td>
                <td style={{ ...cell, fontSize: 11 }}>{c.userId}</td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <button className="btn btn-send" type="button" onClick={() => selectUser(c)}>
                    선택
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {loading && <p className="hint">조회 중...</p>}

      {/* 결과 */}
      {debug && (
        <div style={{ marginTop: 16 }}>
          {!debug.tutorFound && (
            <div className="result-box result-error">⚠️ 해당 userId의 선생님(lesson_tutor)을 찾을 수 없습니다.</div>
          )}

          <div className="section">
            <p className="section-title">결과 요약</p>
            <p>화상과외 추가 제안: <b>{debug.addOnlineClass ? 'O' : 'X'}</b> {debug.lessonCountMultiplier ? `(${debug.lessonCountMultiplier}배)` : ''}</p>
            <p>추천 과목 수: <b>{debug.recommendedSubjects.length}</b> (평가 룰 {debug.activeRuleCount}개)</p>
            <p>
              쿨다운: {debug.inCooldown ? <b style={{ color: '#c0392b' }}>노출 중지(최근 30일 내 노출)</b> : <b style={{ color: '#11b69a' }}>노출 가능</b>}
              {debug.lastShownAt ? ` · 마지막 노출 ${new Date(debug.lastShownAt).toLocaleString()}` : ' · 노출 이력 없음'}
            </p>
          </div>

          {debug.profile && (
            <div className="section">
              <p className="section-title">선생님 신호 (입력)</p>
              <p>전공: {debug.profile.major ?? '-'}</p>
              <p>출신대학: {debug.profile.university ?? '-'}</p>
              <p>출신고교: {debug.profile.highSchool ?? '-'}</p>
              <p>학적: {debug.profile.attendingState ?? '-'}</p>
              <p>대학 캠퍼스 국가코드: {debug.profile.campusCountryCode ?? '-'}</p>
              <p>유학/해외거주: {chips(debug.profile.studyAbroadNations)}</p>
              <p>자격증: {chips(debug.profile.licenses)}</p>
              <p>어학시험: {chips(debug.profile.langSkills)}</p>
              <p>영재원: {chips(debug.profile.giftedNames)}</p>
              <p>합격수기 카테고리: {debug.profile.passNoteCategoryIds.length ? debug.profile.passNoteCategoryIds.join(', ') : '-'}</p>
              <p>이미 보유 과목 수: {debug.profile.taughtSubjectCount}</p>
            </div>
          )}

          <div className="section">
            <p className="section-title">추천 과목 (결과) — 왜 추천됐는지</p>
            {debug.recommendedSubjects.length === 0 ? (
              <p className="hint">추천 과목 없음</p>
            ) : (
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={cell}>과목</th>
                    <th style={cell}>매칭된 신호</th>
                  </tr>
                </thead>
                <tbody>
                  {debug.recommendedSubjects.map((s) => (
                    <tr key={s.subjectId}>
                      <td style={cell}>{s.name ?? s.subjectId}</td>
                      <td style={cell}>{chips(s.matchedSignals.map(sigLabel))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
