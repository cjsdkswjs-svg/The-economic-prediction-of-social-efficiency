import { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CONFIG, type RunResult } from '../simulation/engine';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ResultScreenProps {
  studentId: string;
  studentName: string;
  result: RunResult;
  saveStatus: SaveStatus;
  saveError: string | null;
  muted: boolean;
  onToggleMute: () => void;
  onRetrySave: () => void;
  onReset: () => void;
}

export function ResultScreen({
  studentId,
  studentName,
  result,
  saveStatus,
  saveError,
  muted,
  onToggleMute,
  onRetrySave,
  onReset,
}: ResultScreenProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const corpRounded = Math.round(result.corporateScore);
  const socRounded = Math.round(result.socialScore);
  const combinedFormatted = result.combinedEfficiency.toFixed(1);

  const roleLabel = result.role === 'worker' ? '노동자 시점' : '기업가 시점';
  const portraitSrc =
    result.role === 'worker'
      ? '/src/assets/images/char_veteran_portrait_1795512718097.jpg'
      : '/src/assets/images/char_ceo_portrait_1795512716493.jpg';
  const portraitAlt =
    result.role === 'worker' ? '한빛정밀 현장 기술자 박 반장' : '한빛정밀 대표';

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col justify-between gap-4 px-6 py-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2F6850] pb-2.5">
        <div className="flex flex-wrap items-center gap-3 text-[#F2F9F4]">
          <span className="text-[20px] font-bold">{CONFIG.copy.brandName}</span>
          <span className="text-emerald-400/70" aria-hidden="true">·</span>
          <span className="text-[18px] font-bold text-amber-200">{roleLabel}</span>
          <span className="text-emerald-400/70" aria-hidden="true">·</span>
          <span className="text-[18px] font-semibold text-emerald-100">
            {studentId} {studentName} 최종 결과
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? '배경음·효과음 켜기' : '배경음·효과음 끄기'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#4A876C] bg-[#1E4A37] px-3.5 py-2 text-[16px] font-semibold text-[#F2F9F4] transition-colors hover:bg-[#265B44] whitespace-nowrap shrink-0"
          >
            {muted ? (
              <>
                <VolumeX className="h-4 w-4 text-emerald-200/70" aria-hidden="true" />
                <span>음악·효과음 꺼짐</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-emerald-200" aria-hidden="true" />
                <span>음악·효과음 켜짐</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-[#4A876C] bg-[#1E4A37] px-4 py-2 text-[17px] font-semibold text-[#F2F9F4] transition-colors hover:bg-[#265B44] whitespace-nowrap shrink-0"
          >
            {CONFIG.copy.resetButton}
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4">
        {/* 엔딩 요약 + 캐릭터 초상화 + 기록 저장 안내 */}
        <section className="rounded-2xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-6 shadow-xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-[#2A5C46] bg-[#E8F0EB]">
                {!imgFailed ? (
                  <img
                    src={portraitSrc}
                    alt={portraitAlt}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#185C3E]">
                    <UserRound className="h-10 w-10" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[16px] font-bold text-[#1B5E42]">
                  최종 엔딩 판정 ({studentId} {studentName} · {roleLabel})
                </p>
                <h1
                  data-testid="ending-title"
                  className="mt-1 text-[32px] font-bold tracking-tight text-slate-900"
                >
                  {result.ending.title}
                </h1>
                <p className="mt-1 text-[20px] leading-relaxed text-slate-800">
                  {result.ending.description}
                </p>
              </div>
            </div>

            <div
              data-testid="submission-status"
              className="shrink-0 rounded-xl border border-[#C6DDD0] bg-[#EEF5F0] px-4 py-3 text-[16px]"
            >
              {saveStatus === 'saving' && (
                <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <Loader2 className="h-4 w-4 animate-spin text-[#185C3E]" aria-hidden="true" />
                  결과를 기록하는 중...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="inline-flex items-center gap-2 font-bold text-[#185C3E]">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  참여 기록 저장 완료
                </span>
              )}
              {saveStatus === 'error' && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-rose-700">
                    {saveError || '저장에 실패했습니다.'}
                  </span>
                  <button
                    type="button"
                    onClick={onRetrySave}
                    className="rounded-lg bg-[#185C3E] px-3 py-1 text-[14px] font-bold text-white hover:bg-[#124730]"
                  >
                    다시 저장하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 큰 막대 두 개 나란히: 기업 효율성 vs 사회 효율성 + √(기업효율성 × 사회효율성) */}
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
            <div className="grid grid-cols-2 gap-4 lg:col-span-8">
              <div className="rounded-xl border border-blue-200 bg-blue-50/85 p-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[20px] font-bold text-blue-900">기업 효율성</span>
                  <span
                    data-testid="corp-score"
                    className="font-num text-[38px] font-bold leading-none text-blue-700"
                  >
                    {corpRounded}
                  </span>
                </div>
                <div className="mt-3.5 h-6 w-full overflow-hidden rounded-lg bg-blue-100">
                  <div
                    className="h-full rounded-lg bg-blue-600 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, result.corporateScore))}%` }}
                  />
                </div>
                <p className="mt-2 text-[15px] text-slate-600">
                  0.4 × 생산성 + 0.6 × 이윤
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/85 p-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[20px] font-bold text-emerald-900">사회 효율성</span>
                  <span
                    data-testid="soc-score"
                    className="font-num text-[38px] font-bold leading-none text-emerald-700"
                  >
                    {socRounded}
                  </span>
                </div>
                <div className="mt-3.5 h-6 w-full overflow-hidden rounded-lg bg-emerald-100">
                  <div
                    className="h-full rounded-lg bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, result.socialScore))}%` }}
                  />
                </div>
                <p className="mt-2 text-[15px] text-slate-600">
                  5개 사회 지표 평균
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border-2 border-[#2A5C46] bg-[#EEF5F0] p-5 lg:col-span-4">
              <span className="text-[18px] font-bold text-[#143326]">
                종합 효율 지수
              </span>
              <span
                data-testid="combined-efficiency"
                className="font-num mt-1.5 text-[42px] font-bold leading-none text-[#185C3E]"
              >
                {combinedFormatted}
              </span>
              <p className="mt-2.5 text-[16px] font-semibold text-slate-700">
                √(기업효율성 × 사회효율성)
              </p>
            </div>
          </div>
        </section>

        {/* 7개 지표 최종값 */}
        <section className="rounded-2xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-5 shadow-md">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[21px] font-bold text-slate-900">7개 지표 최종값</h2>
            {result.longTermFeedbackPenalty > 0 && (
              <p className="text-[16px] font-semibold text-rose-700">
                장기 피드백 적용: 소득·소비 50 미만으로 이윤 {result.longTermFeedbackPenalty.toFixed(1)} 감소 반영
              </p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {CONFIG.metricMeta.map((m) => {
              const isCorp = m.group === 'corporate';
              const val = Math.round(result.metrics[m.key]);
              return (
                <div
                  key={m.key}
                  className={`rounded-xl border px-4 py-2.5 ${
                    isCorp
                      ? 'border-blue-200 bg-blue-50/75'
                      : 'border-emerald-200 bg-emerald-50/75'
                  }`}
                >
                  <p className="text-[16px] font-bold text-slate-700">{m.label}</p>
                  <p
                    className={`font-num mt-0.5 text-[28px] font-bold ${
                      isCorp ? 'text-blue-800' : 'text-emerald-800'
                    }`}
                  >
                    {val}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 마무리 질문 + 처음부터 (다음 참가자) */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#3A7D5F] bg-[#0D241B] px-6 py-4 text-white shadow-md">
          <div>
            <p className="text-[15px] font-semibold text-emerald-300">생각해 볼 질문</p>
            <p className="mt-0.5 text-[20px] font-bold text-[#F5FAF7]">
              {CONFIG.copy.resultReflectQuestion}
            </p>
          </div>
          <button
            type="button"
            data-testid="finish-reset-btn"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FAFBF7] px-7 py-3.5 text-[20px] font-bold text-[#123A29] transition-colors hover:bg-emerald-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
            <span>처음부터 (다음 참가자)</span>
          </button>
        </div>
      </main>

      <footer className="text-center">
        <p className="text-[14px] text-emerald-100/80">{CONFIG.copy.disclaimer}</p>
      </footer>
    </div>
  );
}
