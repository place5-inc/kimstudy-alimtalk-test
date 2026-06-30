import { useState, type CSSProperties } from 'react';
import { callProxy, fetchConfirmToken } from '../../shared/api/client';
import { ResultBox, type ResultState } from '../../shared/ui/ResultBox';

// 신호 코드 → 한글 라벨 + 라벨별 색상(bg/fg). 표시 순서는 SIGNAL_ORDER 기준.
interface SigMeta {
  label: string;
  bg: string;
  fg: string;
}
const SIGNAL_META: Record<string, SigMeta> = {
  MAJOR: { label: '전공', bg: '#ede9fe', fg: '#5b3fb5' },
  PRESTIGE_UNIV: { label: '명문대', bg: '#fdf0d0', fg: '#92670c' },
  FOREIGN_UNIV: { label: '해외대학', bg: '#d6f0f7', fg: '#0e7490' },
  HIGH_SCHOOL: { label: '출신고교', bg: '#d8f0ea', fg: '#0f766e' },
  GRADUATION: { label: '졸업여부', bg: '#e8e6f0', fg: '#555077' },
  STUDY_ABROAD: { label: '유학·해외거주', bg: '#dbeafe', fg: '#1d4ed8' },
  CERT: { label: '자격증', bg: '#fde6ef', fg: '#b03060' },
  LANG_SCORE: { label: '어학성적', bg: '#e3f3d4', fg: '#3b6d11' },
  GIFTED: { label: '영재원', bg: '#fde0dd', fg: '#c0392b' },
  PASS_NOTE: { label: '합격수기', bg: '#f3e2f7', fg: '#7a1f8f' },
  SIMILAR_SUBJECT: { label: '유사과목(수업중)', bg: '#ffe8d6', fg: '#b5560f' },
};
// 신호 분포·표에서의 노출 순서
const SIGNAL_ORDER = [
  'MAJOR',
  'PRESTIGE_UNIV',
  'FOREIGN_UNIV',
  'HIGH_SCHOOL',
  'GRADUATION',
  'STUDY_ABROAD',
  'CERT',
  'LANG_SCORE',
  'GIFTED',
  'PASS_NOTE',
  'SIMILAR_SUBJECT',
];
const NEUTRAL: SigMeta = { label: '', bg: '#eee', fg: '#555' };
const metaOf = (code: string): SigMeta => SIGNAL_META[code] ?? { ...NEUTRAL, label: code };

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

// 신호 코드 칩 (라벨별 색상). count가 있으면 분포용으로 개수 뱃지 표시.
function SignalChip({ code, count }: { code: string; count?: number }) {
  const m = metaOf(code);
  return (
    <span className="sigchip" style={{ background: m.bg, color: m.fg }}>
      {m.label}
      {count != null && <span className="sigchip-count">{count}</span>}
    </span>
  );
}

// 임의 문자열 배열을 특정 신호색으로 칩 렌더 (프로필 입력값용)
function ValueChips({ items, code }: { items: string[]; code: string }) {
  if (!items.length) return <span style={{ color: '#bbb' }}>-</span>;
  const m = metaOf(code);
  return (
    <>
      {items.map((t, i) => (
        <span key={`${t}-${i}`} className="sigchip" style={{ background: m.bg, color: m.fg }}>
          {t}
        </span>
      ))}
    </>
  );
}

const cell: CSSProperties = { border: '1px solid #ddd', padding: '6px 8px', fontSize: 13 };

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

  // 추천 결과에 등장한 신호 분포 (개수 내림차순, 동률은 SIGNAL_ORDER)
  const distribution: Array<{ code: string; count: number }> = (() => {
    if (!debug) return [];
    const counts: Record<string, number> = {};
    for (const s of debug.recommendedSubjects)
      for (const code of s.matchedSignals) counts[code] = (counts[code] ?? 0) + 1;
    return Object.keys(counts)
      .map((code) => ({ code, count: counts[code] }))
      .sort((a, b) => b.count - a.count || SIGNAL_ORDER.indexOf(a.code) - SIGNAL_ORDER.indexOf(b.code));
  })();

  return (
    <div className="boost-wrap">
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
            <div className="boost-summary">
              <span>
                추천 과목 <b>{debug.recommendedSubjects.length}</b>개
              </span>
              <span>
                평가 룰 <b>{debug.activeRuleCount}</b>개
              </span>
              <span>
                화상과외 추가 제안 <b>{debug.addOnlineClass ? 'O' : 'X'}</b>
                {debug.lessonCountMultiplier ? ` (${debug.lessonCountMultiplier}배)` : ''}
              </span>
              <span>
                쿨다운{' '}
                {debug.inCooldown ? (
                  <b style={{ color: '#c0392b' }}>노출 중지(최근 30일 내)</b>
                ) : (
                  <b style={{ color: '#11b69a' }}>노출 가능</b>
                )}
                {debug.lastShownAt
                  ? ` · 마지막 ${new Date(debug.lastShownAt).toLocaleString()}`
                  : ' · 노출 이력 없음'}
              </span>
            </div>

            {/* 신호 분포 — 어떤 신호로 몇 과목이 추천됐는지 */}
            {distribution.length > 0 && (
              <>
                <p className="section-title" style={{ marginTop: 16, marginBottom: 8 }}>
                  매칭된 신호 분포
                </p>
                <div className="sig-dist">
                  {distribution.map((d) => (
                    <SignalChip key={d.code} code={d.code} count={d.count} />
                  ))}
                </div>
              </>
            )}
          </div>

          {debug.profile && (
            <div className="section">
              <p className="section-title">선생님 신호 (입력)</p>
              <dl className="kv-grid">
                <dt>
                  <SignalChip code="MAJOR" />
                </dt>
                <dd>{debug.profile.major ?? <span style={{ color: '#bbb' }}>-</span>}</dd>

                <dt>출신대학</dt>
                <dd>{debug.profile.university ?? <span style={{ color: '#bbb' }}>-</span>}</dd>

                <dt>
                  <SignalChip code="HIGH_SCHOOL" />
                </dt>
                <dd>{debug.profile.highSchool ?? <span style={{ color: '#bbb' }}>-</span>}</dd>

                <dt>
                  <SignalChip code="GRADUATION" />
                </dt>
                <dd>{debug.profile.attendingState ?? <span style={{ color: '#bbb' }}>-</span>}</dd>

                <dt>
                  <SignalChip code="FOREIGN_UNIV" />
                </dt>
                <dd>
                  {debug.profile.campusCountryCode ?? <span style={{ color: '#bbb' }}>-</span>}
                  <span className="hint" style={{ margin: 0 }}>
                    (대학 국가코드)
                  </span>
                </dd>

                <dt>
                  <SignalChip code="STUDY_ABROAD" />
                </dt>
                <dd>
                  <ValueChips items={debug.profile.studyAbroadNations} code="STUDY_ABROAD" />
                </dd>

                <dt>
                  <SignalChip code="CERT" />
                </dt>
                <dd>
                  <ValueChips items={debug.profile.licenses} code="CERT" />
                </dd>

                <dt>
                  <SignalChip code="LANG_SCORE" />
                </dt>
                <dd>
                  <ValueChips items={debug.profile.langSkills} code="LANG_SCORE" />
                </dd>

                <dt>
                  <SignalChip code="GIFTED" />
                </dt>
                <dd>
                  <ValueChips items={debug.profile.giftedNames} code="GIFTED" />
                </dd>

                <dt>
                  <SignalChip code="PASS_NOTE" />
                </dt>
                <dd>
                  {debug.profile.passNoteCategoryIds.length ? (
                    debug.profile.passNoteCategoryIds.join(', ')
                  ) : (
                    <span style={{ color: '#bbb' }}>-</span>
                  )}
                </dd>

                <dt>이미 보유 과목</dt>
                <dd>{debug.profile.taughtSubjectCount}개</dd>
              </dl>
            </div>
          )}

          <div className="section">
            <p className="section-title">추천 과목 (결과) — 왜 추천됐는지</p>
            {debug.recommendedSubjects.length === 0 ? (
              <p className="hint">추천 과목 없음</p>
            ) : (
              <table className="boost-table">
                <thead>
                  <tr>
                    <th className="col-subject">과목</th>
                    <th className="col-signal">매칭된 신호</th>
                  </tr>
                </thead>
                <tbody>
                  {debug.recommendedSubjects.map((s) => (
                    <tr key={s.subjectId}>
                      <td className="col-subject">{s.name ?? s.subjectId}</td>
                      <td className="col-signal">
                        <div>
                          {s.matchedSignals.map((code, i) => (
                            <SignalChip key={`${code}-${i}`} code={code} />
                          ))}
                        </div>
                      </td>
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
