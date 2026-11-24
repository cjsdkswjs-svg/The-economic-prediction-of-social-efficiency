import { Fragment, useEffect, useMemo, useState } from 'react';
import { type User } from 'firebase/auth';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Lock,
  LogOut,
  Search,
  ShieldAlert,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  deleteSubmissionForAdmin,
  isVerifiedAdmin,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeAuthState,
  subscribeSubmissionsForAdmin,
  type SubmissionRecord,
} from '../firebase';
import { CONFIG } from '../simulation/engine';

interface AdminScreenProps {
  onBackToGame: () => void;
}

type SortKey = 'combined' | 'corporate' | 'social' | 'latest';
type RoleFilter = 'all' | 'ceo' | 'worker';

export function AdminScreen({ onBackToGame }: AdminScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [records, setRecords] = useState<SubmissionRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>('combined');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeAuthState((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const authorized = isVerifiedAdmin(user);

  useEffect(() => {
    if (!authReady || !authorized) {
      setRecords([]);
      return;
    }

    setLoadingData(true);
    setDataError(null);
    const unsub = subscribeSubmissionsForAdmin(
      (list) => {
        setRecords(list);
        setLoadingData(false);
      },
      (err) => {
        setDataError('데이터를 불러오는 중 권한 또는 네트워크 오류가 발생했습니다: ' + err.message);
        setLoadingData(false);
      }
    );

    return () => unsub();
  }, [authReady, authorized]);

  const handleLogin = async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInAdminWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-blocked')) {
        setAuthError('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용한 뒤 다시 눌러 주세요.');
      } else if (msg.includes('popup-closed-by-user')) {
        setAuthError('로그인이 취소되었습니다.');
      } else {
        setAuthError('로그인 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubmissionForAdmin(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = records.filter((r) => {
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (!q) return true;
      return (
        r.studentId.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.endingTitle.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === 'combined') return b.combinedEfficiency - a.combinedEfficiency;
      if (sortKey === 'corporate') return b.corporateScore - a.corporateScore;
      if (sortKey === 'social') return b.socialScore - a.socialScore;
      return b.createdAtMs - a.createdAtMs;
    });
  }, [records, roleFilter, searchQuery, sortKey]);

  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        total: 0,
        avgCombined: 0,
        topRecord: null as SubmissionRecord | null,
        ceoCount: 0,
        workerCount: 0,
      };
    }
    const total = records.length;
    const sumCombined = records.reduce((acc, r) => acc + r.combinedEfficiency, 0);
    const topRecord = [...records].sort((a, b) => b.combinedEfficiency - a.combinedEfficiency)[0];
    const ceoCount = records.filter((r) => r.role === 'ceo').length;
    const workerCount = records.filter((r) => r.role === 'worker').length;
    return {
      total,
      avgCombined: sumCombined / total,
      topRecord,
      ceoCount,
      workerCount,
    };
  }, [records]);

  const handleExportCsv = () => {
    const header = [
      '순위',
      '학번',
      '이름',
      '역할',
      '종합효율(루트)',
      '기업효율',
      '사회효율',
      '엔딩',
      '생산성',
      '이윤',
      '고용',
      '소득소비',
      '개인정보',
      'AI안전',
      '전문성',
      '기록시각',
    ];
    const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const rows = filteredAndSorted.map((r, idx) => [
      idx + 1,
      r.studentId,
      r.studentName,
      r.role === 'ceo' ? '기업가' : '노동자',
      r.combinedEfficiency.toFixed(1),
      Math.round(r.corporateScore),
      Math.round(r.socialScore),
      r.endingTitle,
      Math.round(r.metrics.Pd),
      Math.round(r.metrics.Pf),
      Math.round(r.metrics.E),
      Math.round(r.metrics.C),
      Math.round(r.metrics.D),
      Math.round(r.metrics.A),
      Math.round(r.metrics.S),
      new Date(r.createdAtMs).toLocaleString('ko-KR'),
    ]);

    const csv = '\uFEFF' + [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `한빛정밀_순위결과_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 로그인 대기 또는 미인증 상태
  if (!authReady || !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-6 py-10">
        <div className="rounded-2xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-8 shadow-xl">
          <div className="flex items-center gap-3 text-[#185C3E]">
            <Lock className="h-7 w-7" aria-hidden="true" />
            <span className="text-[18px] font-bold">운영자 전용 공간</span>
          </div>
          <h1 className="mt-2 text-[30px] font-bold tracking-tight text-slate-900">
            관리자 순위 비교 대시보드
          </h1>
          <p className="mt-2.5 text-[19px] leading-relaxed text-slate-700">
            이 페이지는 부스 운영진 태블릿(패드)에서만 전체 참가자 점수와 순위를 실시간으로 확인하기 위한 관리자 전용 공간입니다.
          </p>

          {authError && (
            <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-[17px] font-semibold text-rose-700">
              {authError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="admin-login-btn"
              disabled={!authReady || signingIn}
              onClick={handleLogin}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#185C3E] px-7 py-4 text-[20px] font-bold text-white transition-colors hover:bg-[#124730] disabled:opacity-60"
            >
              <Lock className="h-5 w-5" aria-hidden="true" />
              <span>{signingIn ? '로그인 확인 중...' : 'Google 관리자 로그인'}</span>
            </button>

            <button
              type="button"
              onClick={onBackToGame}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C6DDD0] bg-white px-6 py-4 text-[19px] font-bold text-slate-800 transition-colors hover:bg-[#EEF5F0]"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              <span>게임으로 돌아가기</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 다른 Google 계정으로 로그인된 경우 접근 차단
  if (!authorized) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-6 py-10">
        <div className="rounded-2xl border-2 border-rose-300 bg-[#FAFBF7] p-8 shadow-xl">
          <div className="flex items-center gap-3 text-rose-700">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
            <span className="text-[18px] font-bold">접근 권한 없음</span>
          </div>
          <h1 className="mt-2 text-[28px] font-bold text-slate-900">
            관리자 계정이 아닙니다
          </h1>
          <p className="mt-2.5 text-[19px] leading-relaxed text-slate-700">
            현재 로그인된 계정(<strong className="text-slate-900">{user.email}</strong>)에는 열람 권한이 없습니다. 지정된 관리자 계정(<strong>{ADMIN_EMAIL}</strong>)으로 로그인해 주세요.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                await handleLogout();
                await handleLogin();
              }}
              className="rounded-xl bg-[#185C3E] px-6 py-3.5 text-[19px] font-bold text-white hover:bg-[#124730]"
            >
              관리자 계정으로 다시 로그인
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-[18px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              로그아웃
            </button>
            <button
              type="button"
              onClick={onBackToGame}
              className="rounded-xl border border-[#C6DDD0] bg-[#EEF5F0] px-5 py-3.5 text-[18px] font-bold text-[#143326] hover:bg-[#DFECE4]"
            >
              게임으로 돌아가기
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col gap-4 px-5 py-5">
      {/* 상단 관리자 바 (패드 가로/세로 터치 최적화) */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2F6850] pb-3">
        <div className="flex flex-wrap items-center gap-3 text-[#F2F9F4]">
          <Trophy className="h-6 w-6 text-amber-300" aria-hidden="true" />
          <h1 className="text-[22px] font-bold">{CONFIG.copy.brandName} 관리자 순위표</h1>
          <span className="rounded-md bg-[#1E4A37] px-2.5 py-1 text-[14px] font-semibold text-emerald-200">
            실시간 동기화 중
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredAndSorted.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-[#4A876C] bg-[#1E4A37] px-4 py-2 text-[16px] font-semibold text-[#F2F9F4] transition-colors hover:bg-[#265B44] disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>CSV 내보내기</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-[#4A876C] bg-[#1E4A37] px-4 py-2 text-[16px] font-semibold text-[#F2F9F4] transition-colors hover:bg-[#265B44]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>로그아웃</span>
          </button>

          <button
            type="button"
            onClick={onBackToGame}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FAFBF7] px-4 py-2 text-[16px] font-bold text-[#143326] transition-colors hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>게임 화면</span>
          </button>
        </div>
      </header>

      {/* 요약 KPI 4개 */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-4">
          <p className="text-[15px] font-bold text-[#1B5E42]">총 참여 인원</p>
          <p className="font-num mt-1 text-[32px] font-bold text-slate-900">{stats.total}명</p>
          <p className="mt-0.5 text-[14px] text-slate-600">
            기업가 {stats.ceoCount} · 노동자 {stats.workerCount}
          </p>
        </div>

        <div className="rounded-xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-4">
          <p className="text-[15px] font-bold text-[#1B5E42]">평균 종합 효율</p>
          <p className="font-num mt-1 text-[32px] font-bold text-[#185C3E]">
            {stats.avgCombined.toFixed(1)}
          </p>
          <p className="mt-0.5 text-[14px] text-slate-600">√(기업효율성 × 사회효율성)</p>
        </div>

        <div className="col-span-2 rounded-xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-4">
          <p className="text-[15px] font-bold text-[#1B5E42]">현재 1위 (종합 효율 기준)</p>
          {stats.topRecord ? (
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[24px] font-bold text-slate-900">
                {stats.topRecord.studentId} {stats.topRecord.studentName}{' '}
                <span className="text-[16px] font-semibold text-[#1B5E42]">
                  ({stats.topRecord.role === 'ceo' ? '기업가' : '노동자'})
                </span>
              </p>
              <p className="font-num text-[32px] font-bold text-[#185C3E]">
                {stats.topRecord.combinedEfficiency.toFixed(1)}점
              </p>
            </div>
          ) : (
            <p className="mt-1 text-[20px] text-slate-500">아직 제출된 기록이 없습니다.</p>
          )}
        </div>
      </section>

      {/* 검색 · 필터 · 정렬 바 */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'ceo', 'worker'] as RoleFilter[]).map((rf) => (
            <button
              key={rf}
              type="button"
              onClick={() => setRoleFilter(rf)}
              className={`rounded-lg border px-4 py-2 text-[16px] font-bold transition-colors ${
                roleFilter === rf
                  ? 'border-[#185C3E] bg-[#185C3E] text-white'
                  : 'border-[#C6DDD0] bg-white text-slate-700 hover:bg-[#EEF5F0]'
              }`}
            >
              {rf === 'all' ? '전체' : rf === 'ceo' ? '기업가' : '노동자'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold text-slate-700">정렬:</span>
          {(
            [
              ['combined', '종합 효율 순위'],
              ['corporate', '기업 효율순'],
              ['social', '사회 효율순'],
              ['latest', '최신순'],
            ] as [SortKey, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSortKey(k)}
              className={`rounded-lg border px-3.5 py-2 text-[15px] font-bold transition-colors ${
                sortKey === k
                  ? 'border-[#185C3E] bg-[#E8F4ED] text-[#143326]'
                  : 'border-[#C6DDD0] bg-white text-slate-700 hover:bg-[#EEF5F0]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px] flex-1 sm:max-w-[300px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="학번 또는 이름 검색"
            aria-label="학번 또는 이름 검색"
            className="w-full rounded-lg border-2 border-[#C6DDD0] bg-white py-2 pl-9 pr-3 text-[16px] text-slate-900 placeholder:text-slate-400 focus:border-[#185C3E] focus:outline-none"
          />
        </div>
      </section>

      {dataError && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-[16px] font-bold text-rose-700">
          {dataError}
        </div>
      )}

      {/* 순위 목록 테이블 (iPad 터치/스크롤 대응) */}
      <section className="flex-1 overflow-hidden rounded-2xl border-2 border-[#2A5C46] bg-[#FAFBF7] shadow-xl">
        {loadingData ? (
          <div className="p-10 text-center text-[20px] font-semibold text-slate-600">
            참여자 순위를 불러오는 중입니다...
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-10 text-center text-[20px] font-semibold text-slate-600">
            표시할 참여 기록이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-[#C6DDD0] bg-[#EEF5F0] text-[15px] font-bold text-[#143326]">
                  <th className="px-4 py-3.5">순위</th>
                  <th className="px-4 py-3.5">학번</th>
                  <th className="px-4 py-3.5">이름</th>
                  <th className="px-4 py-3.5">역할</th>
                  <th className="px-4 py-3.5">종합 효율 √(기업×사회)</th>
                  <th className="px-4 py-3.5">기업 효율</th>
                  <th className="px-4 py-3.5">사회 효율</th>
                  <th className="px-4 py-3.5">엔딩</th>
                  <th className="px-4 py-3.5 text-right">상세 / 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECE6] text-[17px]">
                {filteredAndSorted.map((rec, idx) => {
                  const rank = idx + 1;
                  const isExpanded = expandedId === rec.id;
                  const isConfirming = confirmDeleteId === rec.id;
                  return (
                    <Fragment key={rec.id}>
                      <tr
                        className="transition-colors hover:bg-[#F3F8F5]"
                      >
                        <td className="px-4 py-3 font-num font-bold">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                              rank === 1
                                ? 'bg-amber-300 text-amber-950'
                                : rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : rank === 3
                                ? 'bg-orange-200 text-orange-950'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-num font-semibold text-slate-800">
                          {rec.studentId}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{rec.studentName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-md px-2.5 py-0.5 text-[14px] font-bold ${
                              rec.role === 'ceo'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {rec.role === 'ceo' ? '기업가' : '노동자'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-num text-[21px] font-bold text-[#185C3E]">
                          {rec.combinedEfficiency.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 font-num font-bold text-blue-700">
                          {Math.round(rec.corporateScore)}
                        </td>
                        <td className="px-4 py-3 font-num font-bold text-emerald-700">
                          {Math.round(rec.socialScore)}
                        </td>
                        <td className="px-4 py-3 text-[16px] font-semibold text-slate-700">
                          {rec.endingTitle}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                              aria-label={`${rec.studentName} 세부 지표 보기`}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#C6DDD0] bg-white px-3 py-1.5 text-[14px] font-bold text-slate-700 hover:bg-[#EEF5F0]"
                            >
                              <span>세부</span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>

                            {isConfirming ? (
                              <button
                                type="button"
                                onClick={() => handleDelete(rec.id)}
                                className="rounded-lg bg-rose-600 px-3 py-1.5 text-[14px] font-bold text-white hover:bg-rose-700"
                              >
                                삭제 확인
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(rec.id)}
                                aria-label={`${rec.studentName} 기록 삭제`}
                                className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[14px] font-bold text-rose-700 hover:bg-rose-100"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${rec.id}-details`} className="bg-[#EEF5F0]/60">
                          <td colSpan={9} className="px-5 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap gap-3 text-[15px]">
                                {CONFIG.metricMeta.map((m) => (
                                  <span
                                    key={m.key}
                                    className="rounded-lg border border-[#C6DDD0] bg-white px-3 py-1 font-semibold text-slate-800"
                                  >
                                    {m.label}:{' '}
                                    <strong className="font-num text-[#185C3E]">
                                      {Math.round(rec.metrics[m.key])}
                                    </strong>
                                  </span>
                                ))}
                              </div>
                              <span className="text-[14px] text-slate-600">
                                제출: {new Date(rec.createdAtMs).toLocaleString('ko-KR')}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
