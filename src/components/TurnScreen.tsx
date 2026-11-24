import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CONFIG,
  type AutomationLevel,
  type ChoiceLetter,
  type MetricDeltas,
  type Metrics,
  type RoleType,
  type RoleplayOutcome,
  type TurnNumber,
} from '../simulation/engine';
import { MetricsBar } from './MetricsBar';

export interface TurnOptionView {
  key: string;
  label: string;
  subLabel?: string;
  outcome: RoleplayOutcome;
}

interface TurnScreenProps {
  studentId: string;
  studentName: string;
  role: RoleType;
  turnNumber: TurnNumber;
  metrics: Metrics;
  lastDeltas: MetricDeltas | null;
  lastEfficiencyDelta: number | null;
  automationLevel: AutomationLevel | null;
  selectedOptionKey: string | null;
  turn2AutoProfitBadge: string | null;
  muted: boolean;
  onToggleMute: () => void;
  onSelectOption: (key: string, outcome: RoleplayOutcome) => void;
  onNext: () => void;
  onReset: () => void;
}

function getCharacterForTurn(role: RoleType, turnNumber: TurnNumber) {
  if (role === 'worker') {
    if (turnNumber === 1 || turnNumber === 4 || turnNumber === 7) {
      return {
        name: '나 (박 반장)',
        roleLabel: '현장 30년 숙련 기술자',
        image: '/src/assets/images/char_veteran_portrait_1795512718097.jpg',
      };
    }
    return {
      name: '이 대리',
      roleLabel: '현장 동료 · AI 운영팀',
      image: '/src/assets/images/char_engineer_portrait_1795512718011.jpg',
    };
  }

  if (turnNumber === 1 || turnNumber === 6 || turnNumber === 7) {
    return {
      name: '나 (대표)',
      roleLabel: '한빛정밀 CEO',
      image: '/src/assets/images/char_ceo_portrait_1795512716493.jpg',
    };
  }
  if (turnNumber === 2 || turnNumber === 3 || turnNumber === 5) {
    return {
      name: '이 대리',
      roleLabel:
        turnNumber === 2
          ? '해외 영업·시장 분석'
          : turnNumber === 3
          ? 'AI·보안 운영 담당'
          : '작업장 스마트 시스템 담당',
      image: '/src/assets/images/char_engineer_portrait_1795512718011.jpg',
    };
  }
  return {
    name: '박 반장',
    roleLabel: '30년 경력 숙련 기술자',
    image: '/src/assets/images/char_veteran_portrait_1795512718097.jpg',
  };
}

function getSpeakerAvatar(speaker: string): string {
  if (speaker.includes('박 반장')) {
    return '/src/assets/images/char_veteran_portrait_1795512718097.jpg';
  }
  if (speaker.includes('이 대리')) {
    return '/src/assets/images/char_engineer_portrait_1795512718011.jpg';
  }
  return '/src/assets/images/char_ceo_portrait_1795512716493.jpg';
}

function formatSummaryDelta(key: string, delta: number): string {
  const meta = CONFIG.metricMeta.find((m) => m.key === key);
  const label = meta ? meta.label : key;
  const abs = Math.abs(delta);
  const numStr = Number.isInteger(abs) ? String(abs) : abs.toFixed(1).replace(/\.0$/, '');
  return `${label} ${delta > 0 ? '▲' : '▼'} ${numStr}`;
}

export function TurnScreen({
  studentId,
  studentName,
  role,
  turnNumber,
  metrics,
  lastDeltas,
  lastEfficiencyDelta,
  automationLevel,
  selectedOptionKey,
  turn2AutoProfitBadge,
  muted,
  onToggleMute,
  onSelectOption,
  onNext,
  onReset,
}: TurnScreenProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const isWorker = role === 'worker';
  let title = '';
  let situation = '';
  let options: TurnOptionView[] = [];

  if (turnNumber === 1) {
    const t1 = isWorker ? CONFIG.workerScenario.turn1 : CONFIG.turn1;
    title = t1.title;
    situation = t1.situation;
    options = t1.options.map((o) => ({
      key: String(o.level),
      label: o.label,
      subLabel: o.subLabel,
      outcome: o.outcome,
    }));
  } else if (turnNumber === 2) {
    const lvl = (automationLevel ?? 0) as AutomationLevel;
    const t2 = isWorker ? CONFIG.workerScenario.turn2 : CONFIG.turn2;
    title = t2.title;
    situation = t2.introByLevel[lvl].text;
    options = t2.options.map((o) => ({
      key: o.choice as ChoiceLetter,
      label: o.label,
      outcome: o.outcome,
    }));
  } else if (turnNumber === 3) {
    const lvl = (automationLevel ?? 0) as AutomationLevel;
    const t3 = isWorker ? CONFIG.workerScenario.turn3 : CONFIG.turn3;
    title = t3.title;
    situation = t3.introByLevel[lvl];
    options = t3.options.map((o) => ({
      key: o.choice as ChoiceLetter,
      label: o.label,
      outcome: o.outcome,
    }));
  } else if (turnNumber === 4) {
    const lvl = (automationLevel ?? 0) as AutomationLevel;
    const t4 = isWorker ? CONFIG.workerScenario.turn4 : CONFIG.turn4;
    title = t4.title;
    situation = t4.introByLevel[lvl];
    options = t4.options.map((o) => ({
      key: o.choice as ChoiceLetter,
      label: o.label,
      outcome: o.outcome,
    }));
  } else if (turnNumber === 5) {
    const t5 = isWorker ? CONFIG.workerScenario.turn5 : CONFIG.turn5;
    title = t5.title;
    situation = t5.situation;
    options = t5.options.map((o) => ({
      key: o.choice as ChoiceLetter,
      label: o.label,
      outcome: o.outcome,
    }));
  } else if (turnNumber === 6) {
    const t6 = isWorker ? CONFIG.workerScenario.turn6 : CONFIG.turn6;
    title = t6.title;
    situation = t6.situation;
    options = t6.options.map((o) => ({
      key: o.choice as ChoiceLetter,
      label: o.label,
      outcome: o.outcome,
    }));
  } else {
    const t7 = isWorker ? CONFIG.workerScenario.turn7 : CONFIG.turn7;
    title = t7.title;
    situation = t7.situation;
    options = t7.options.map((o) => ({
      key: o.choice as ChoiceLetter,
      label: o.label,
      outcome: o.outcome,
    }));
  }

  const character = getCharacterForTurn(role, turnNumber);
  const activeDeltaEntries = lastDeltas
    ? Object.entries(lastDeltas).filter(([, val]) => val !== undefined && Math.abs(val) >= 0.05)
    : [];

  const selectedOpt = options.find((o) => o.key === selectedOptionKey) ?? null;
  const isChoiceLocked = selectedOpt !== null;

  const factoryModeLabel =
    automationLevel === null
      ? '도입 수준 결정 대기'
      : automationLevel === 0
      ? '사람 중심 (L=0)'
      : automationLevel === 1
      ? '안전 보조 도입 (L=1)'
      : automationLevel === 2
      ? '부분 자동화 (L=2)'
      : '전면 무인화 (L=3)';

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col gap-2.5 px-6 py-3">
      {/* 상단 게임 바 */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2F6850] pb-2">
        <div className="flex flex-wrap items-center gap-3 text-[#F2F9F4]">
          <span className="text-[20px] font-bold tracking-tight whitespace-nowrap">
            {CONFIG.copy.brandName}
          </span>
          <span className="text-emerald-400/70" aria-hidden="true">·</span>
          <span className="text-[18px] font-bold text-amber-200 whitespace-nowrap">
            {role === 'ceo' ? '기업가 시점' : '노동자 시점'}
          </span>
          <span className="text-emerald-400/70" aria-hidden="true">·</span>
          <span className="text-[17px] font-semibold text-emerald-100 whitespace-nowrap">
            {studentId} {studentName}
          </span>
          <span className="text-emerald-400/70" aria-hidden="true">·</span>
          <span
            data-testid="turn-progress"
            className="font-num text-[18px] font-bold text-white whitespace-nowrap"
          >
            {turnNumber}/{CONFIG.totalTurns}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? '배경음·효과음 켜기' : '배경음·효과음 끄기'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#4A876C] bg-[#1E4A37] px-3.5 py-1.5 text-[16px] font-semibold text-[#F2F9F4] transition-colors hover:bg-[#265B44] whitespace-nowrap shrink-0"
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
            className="rounded-lg border border-[#4A876C] bg-[#1E4A37] px-4 py-1.5 text-[16px] font-semibold text-[#F2F9F4] transition-colors hover:bg-[#265B44] whitespace-nowrap shrink-0"
          >
            {CONFIG.copy.resetButton}
          </button>
        </div>
      </header>

      {/* 상단 7개 지표 막대 */}
      <MetricsBar metrics={metrics} lastDeltas={lastDeltas} />

      {/* 메인 캐릭터 대화 + 4개 선택지 무대 */}
      <motion.main
        key={`turn-${turnNumber}-${role}`}
        initial={{ opacity: 0.7, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 flex-col justify-between gap-2.5 rounded-2xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-4 shadow-xl"
      >
        {/* 캐릭터 초상화 + 상황 대사창 */}
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-stretch">
          <div className="flex shrink-0 flex-row items-center gap-3 sm:w-[132px] sm:flex-col sm:items-stretch">
            <div className="h-20 w-20 overflow-hidden rounded-xl border-2 border-[#2A5C46] bg-[#E8F0EB] sm:h-[116px] sm:w-[132px]">
              {!imgFailed ? (
                <img
                  src={character.image}
                  alt={character.name}
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
            <div className="rounded-xl border border-[#C6DDD0] bg-[#EEF5F0] px-2 py-1 text-left sm:text-center">
              <p className="text-[16px] font-bold text-slate-900">{character.name}</p>
              <p className="text-[12px] font-semibold text-[#1B5E42]">{character.roleLabel}</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between rounded-xl border border-[#C6DDD0] bg-white px-5 py-3.5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-1.5">
                <h1 className="text-[23px] font-bold tracking-tight text-slate-900">
                  턴 {turnNumber} — {title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-[15px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#1B5E42]">
                    <Cpu className="h-4 w-4" aria-hidden="true" />
                    {factoryModeLabel}
                  </span>
                  {turnNumber === 2 && turn2AutoProfitBadge && (
                    <span className="font-num font-bold text-rose-700">
                      [시장 충격 자동 반영: {turn2AutoProfitBadge}]
                    </span>
                  )}
                </div>
              </div>

              <p
                data-testid="turn-situation"
                className="mt-2.5 max-w-[74ch] text-[20px] font-medium leading-relaxed text-slate-900"
              >
                {situation}
              </p>
            </div>

            {!isChoiceLocked && (
              <p className="mt-2 text-[14px] font-semibold text-[#1B5E42]">
                아래 4가지 행동 중 하나를 클릭해 결과를 확인하세요. (좋고 나쁜 선택 순서는 섞여 있습니다)
              </p>
            )}
          </div>
        </div>

        {/* 선택지 버튼 4개 */}
        <div className="grid grid-cols-1 gap-2" role="group" aria-label="선택지">
          {options.map((opt) => {
            const isSelected = selectedOptionKey === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                disabled={isChoiceLocked}
                onClick={() => onSelectOption(opt.key, opt.outcome)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border-2 px-4 py-2.5 text-left transition-colors duration-75 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  isSelected
                    ? 'border-[#185C3E] bg-[#E8F4ED] text-[#0E3524] shadow-xs'
                    : isChoiceLocked
                    ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-70'
                    : 'border-[#C6DDD0] bg-white text-slate-900 hover:border-[#185C3E] hover:bg-[#F1F8F4]'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[20px] font-bold leading-snug">{opt.label}</span>
                  {opt.subLabel && (
                    <span className="text-[16px] font-normal text-slate-600">
                      {opt.subLabel}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <CheckCircle2
                    className="h-6 w-6 shrink-0 text-[#185C3E]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 선택 직후 역할극 결과 리포트 + 캐릭터 반응 + '다음' 버튼 */}
        {isChoiceLocked && selectedOpt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            data-testid="roleplay-outcome-box"
            className={`flex flex-col justify-between gap-3 rounded-xl border-2 px-4 py-3 lg:flex-row lg:items-center ${
              lastEfficiencyDelta !== null && lastEfficiencyDelta < -0.05
                ? 'border-rose-300 bg-rose-50/90'
                : lastEfficiencyDelta !== null && lastEfficiencyDelta > 0.05
                ? 'border-emerald-400 bg-emerald-50/90'
                : selectedOpt.outcome.severity === 'warning'
                ? 'border-rose-300 bg-rose-50/90'
                : selectedOpt.outcome.severity === 'positive'
                ? 'border-emerald-400 bg-emerald-50/90'
                : 'border-[#9CC3AE] bg-[#EEF5F0]'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <img
                src={getSpeakerAvatar(selectedOpt.outcome.reactionSpeaker)}
                alt={selectedOpt.outcome.reactionSpeaker}
                referrerPolicy="no-referrer"
                className="h-12 w-12 shrink-0 rounded-lg border border-slate-300 object-cover"
              />
              <div className="min-w-0 space-y-0.5">
                <p className="text-[19px] font-bold leading-snug text-slate-900">
                  {selectedOpt.outcome.headline}
                </p>
                <p className="text-[17px] text-slate-800">
                  <strong className="font-bold text-[#143326]">
                    {selectedOpt.outcome.reactionSpeaker}:
                  </strong>{' '}
                  “{selectedOpt.outcome.reactionLine}”
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-0.5 text-[16px]">
                  {lastEfficiencyDelta !== null && (
                    <span
                      data-testid="efficiency-step-delta"
                      className={`font-num font-bold ${
                        lastEfficiencyDelta > 0.05
                          ? 'text-[#185C3E]'
                          : lastEfficiencyDelta < -0.05
                          ? 'text-rose-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {lastEfficiencyDelta > 0.05
                        ? `종합 효율 ▲ ${lastEfficiencyDelta.toFixed(1)}`
                        : lastEfficiencyDelta < -0.05
                        ? `종합 효율 ▼ ${Math.abs(lastEfficiencyDelta).toFixed(1)}`
                        : '종합 효율 변화 없음'}
                    </span>
                  )}
                  <span className="font-bold text-slate-700">수치 변화:</span>
                  {activeDeltaEntries.length === 0 ? (
                    <span className="text-slate-600">지표 변화 없음</span>
                  ) : (
                    activeDeltaEntries.map(([key, val]) => (
                      <span
                        key={key}
                        className={`font-num font-bold ${
                          (val ?? 0) > 0 ? 'text-blue-700' : 'text-rose-700'
                        }`}
                      >
                        {formatSummaryDelta(key, val ?? 0)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              data-testid="next-turn-btn"
              onClick={onNext}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#185C3E] px-7 py-3 text-[20px] font-bold text-white transition-colors hover:bg-[#124730] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 whitespace-nowrap shrink-0"
            >
              <span>
                {turnNumber === CONFIG.totalTurns
                  ? CONFIG.copy.finishButton
                  : CONFIG.copy.nextButton}
              </span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
