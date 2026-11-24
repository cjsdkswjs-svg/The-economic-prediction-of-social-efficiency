import { useCallback, useEffect, useState } from 'react';
import {
  CONFIG,
  applyMetricStep,
  calculateCombinedEfficiency,
  calculateCorporateScore,
  calculateSocialScore,
  createInitialMetrics,
  finalizeRun,
  getTurn1Deltas,
  getTurn2ChoiceDeltas,
  getTurn2IntroDelta,
  getTurn3ChoiceDeltas,
  getTurn4ChoiceDeltas,
  getTurn5ChoiceDeltas,
  getTurn6ChoiceDeltas,
  getTurn7ChoiceDeltas,
  runSelfTest,
  type AutomationLevel,
  type ChoiceLetter,
  type MetricDeltas,
  type Metrics,
  type RoleType,
  type RoleplayOutcome,
  type RunChoices,
  type RunResult,
  type TurnNumber,
} from './simulation/engine';
import { submitSimulationResult } from './firebase';
import {
  playChoiceOutcomeSound,
  playClickSound,
  playEndingFanfare,
  setBgmMuted,
  startBgm,
  stopBgmLoop,
  type EffectSeverity,
} from './utils/fx';
import { FxOverlay, type FxTrigger } from './components/FxOverlay';
import { StartScreen } from './components/StartScreen';
import { TurnScreen } from './components/TurnScreen';
import { ResultScreen, type SaveStatus } from './components/ResultScreen';
import { AdminScreen } from './components/AdminScreen';

type ScreenPhase = 'start' | 'turn' | 'result' | 'admin';

declare global {
  interface Window {
    runSelfTest?: typeof runSelfTest;
  }
}

export default function App() {
  const [phase, setPhase] = useState<ScreenPhase>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1') {
        return 'admin';
      }
      if (params.get('autostart') === '1') {
        return 'turn';
      }
    }
    return 'start';
  });

  const [studentId, setStudentId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return '10101';
    }
    return '';
  });
  const [studentName, setStudentName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return '체험자';
    }
    return '';
  });

  const [role, setRole] = useState<RoleType>('ceo');
  const [turnNumber, setTurnNumber] = useState<TurnNumber>(1);
  const [metrics, setMetrics] = useState<Metrics>(() => createInitialMetrics());
  const [lastDeltas, setLastDeltas] = useState<MetricDeltas | null>(null);
  const [lastEfficiencyDelta, setLastEfficiencyDelta] = useState<number | null>(null);
  const [automationLevel, setAutomationLevel] = useState<AutomationLevel | null>(null);
  const [choices, setChoices] = useState<Partial<RunChoices>>({});
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [turn2AutoProfitBadge, setTurn2AutoProfitBadge] = useState<string | null>(null);

  const [muted, setMuted] = useState(false);
  const [fxTrigger, setFxTrigger] = useState<FxTrigger | null>(null);

  const [finalResult, setFinalResult] = useState<RunResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    window.runSelfTest = runSelfTest;
    return () => {
      delete window.runSelfTest;
      stopBgmLoop();
    };
  }, []);

  useEffect(() => {
    const bodyStateMap: Record<ScreenPhase, string> = {
      start: 'title',
      turn: 'playing',
      result: 'result',
      admin: 'admin',
    };
    document.body.dataset.state = bodyStateMap[phase];
  }, [phase]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const nextMuted = !prev;
      setBgmMuted(nextMuted);
      if (!nextMuted) {
        playClickSound(false);
      }
      return nextMuted;
    });
  }, []);

  const handleSelectRole = useCallback(
    (nextRole: RoleType) => {
      startBgm(muted);
      playClickSound(muted);
      setRole(nextRole);
    },
    [muted]
  );

  const handleReset = useCallback(() => {
    playClickSound(muted);
    setPhase('start');
    setStudentId('');
    setStudentName('');
    setTurnNumber(1);
    setMetrics(createInitialMetrics());
    setLastDeltas(null);
    setLastEfficiencyDelta(null);
    setAutomationLevel(null);
    setChoices({});
    setSelectedOptionKey(null);
    setTurn2AutoProfitBadge(null);
    setFinalResult(null);
    setSaveStatus('idle');
    setSaveError(null);
    setFxTrigger(null);
  }, [muted]);

  const handleStartRun = useCallback(() => {
    startBgm(muted);
    playClickSound(muted);
    setTurnNumber(1);
    setMetrics(createInitialMetrics());
    setLastDeltas(null);
    setLastEfficiencyDelta(null);
    setAutomationLevel(null);
    setChoices({});
    setSelectedOptionKey(null);
    setTurn2AutoProfitBadge(null);
    setFinalResult(null);
    setSaveStatus('idle');
    setSaveError(null);
    setPhase('turn');
  }, [muted]);

  const persistResult = useCallback(
    async (res: RunResult) => {
      setSaveStatus('saving');
      setSaveError(null);
      try {
        await submitSimulationResult({
          studentId,
          studentName,
          role: res.role,
          corporateScore: res.corporateScore,
          socialScore: res.socialScore,
          combinedEfficiency: res.combinedEfficiency,
          endingTitle: res.ending.title,
          metrics: res.metrics,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to submit result:', err);
        setSaveStatus('error');
        setSaveError('네트워크 문제로 저장되지 않았습니다. 다시 시도해 주세요.');
      }
    },
    [studentId, studentName]
  );

  const handleSelectOption = useCallback(
    (optionKey: string, outcome: RoleplayOutcome) => {
      if (selectedOptionKey !== null) return;

      startBgm(muted);

      const beforeEff = calculateCombinedEfficiency(
        calculateCorporateScore(metrics),
        calculateSocialScore(metrics)
      );

      let rawDeltas: MetricDeltas;
      if (turnNumber === 1) {
        const lvl = Number(optionKey) as AutomationLevel;
        rawDeltas = getTurn1Deltas(lvl, role);
        setAutomationLevel(lvl);
        setChoices((prev) => ({ ...prev, turn1: lvl }));
      } else if (turnNumber === 2) {
        const choice = optionKey as ChoiceLetter;
        rawDeltas = getTurn2ChoiceDeltas(choice, role);
        setChoices((prev) => ({ ...prev, turn2: choice }));
      } else if (turnNumber === 3) {
        const lvl = (automationLevel ?? 0) as AutomationLevel;
        const choice = optionKey as ChoiceLetter;
        rawDeltas = getTurn3ChoiceDeltas(lvl, choice, role);
        setChoices((prev) => ({ ...prev, turn3: choice }));
      } else if (turnNumber === 4) {
        const lvl = (automationLevel ?? 0) as AutomationLevel;
        const choice = optionKey as ChoiceLetter;
        rawDeltas = getTurn4ChoiceDeltas(lvl, choice, role);
        setChoices((prev) => ({ ...prev, turn4: choice }));
      } else if (turnNumber === 5) {
        const choice = optionKey as ChoiceLetter;
        rawDeltas = getTurn5ChoiceDeltas(choice, role);
        setChoices((prev) => ({ ...prev, turn5: choice }));
      } else if (turnNumber === 6) {
        const choice = optionKey as ChoiceLetter;
        rawDeltas = getTurn6ChoiceDeltas(choice, role);
        setChoices((prev) => ({ ...prev, turn6: choice }));
      } else {
        const choice = optionKey as ChoiceLetter;
        rawDeltas = getTurn7ChoiceDeltas(choice, role);
        setChoices((prev) => ({ ...prev, turn7: choice }));
      }

      const { next, actualChanges } = applyMetricStep(metrics, rawDeltas);
      const afterEff = calculateCombinedEfficiency(
        calculateCorporateScore(next),
        calculateSocialScore(next)
      );
      const effDelta = afterEff - beforeEff;

      setMetrics(next);
      setLastDeltas(actualChanges);
      setLastEfficiencyDelta(effDelta);
      setSelectedOptionKey(optionKey);

      playChoiceOutcomeSound(muted, effDelta);

      const fxSeverity: EffectSeverity =
        effDelta > 0.05 ? 'positive' : effDelta < -0.05 ? 'warning' : outcome.severity;
      setFxTrigger({ id: Date.now(), severity: fxSeverity });
    },
    [selectedOptionKey, muted, turnNumber, role, metrics, automationLevel]
  );

  const handleNextTurn = useCallback(() => {
    if (selectedOptionKey === null) return;
    startBgm(muted);
    playClickSound(muted);

    if (turnNumber === 1) {
      const lvl = (automationLevel ?? 0) as AutomationLevel;
      const t2Source = role === 'worker' ? CONFIG.workerScenario.turn2 : CONFIG.turn2;
      const introInfo = t2Source.introByLevel[lvl];
      const introDelta = getTurn2IntroDelta(lvl, role);
      const { next, actualChanges } = applyMetricStep(metrics, introDelta);
      setMetrics(next);
      setLastDeltas(actualChanges);
      setLastEfficiencyDelta(null);
      setTurn2AutoProfitBadge(introInfo.badge);
      setTurnNumber(2);
      setSelectedOptionKey(null);
      return;
    }

    if (turnNumber < CONFIG.totalTurns) {
      setTurnNumber((turnNumber + 1) as TurnNumber);
      setSelectedOptionKey(null);
      setLastDeltas(null);
      setLastEfficiencyDelta(null);
      setTurn2AutoProfitBadge(null);
      return;
    }

    // Turn 7 완료 -> 단일 회차 최종 결과 계산 및 Firestore 실시간 저장
    const finalized = finalizeRun(
      metrics,
      (automationLevel ?? 0) as AutomationLevel,
      {
        turn1: choices.turn1 ?? 0,
        turn2: choices.turn2 ?? 'A',
        turn3: choices.turn3 ?? 'A',
        turn4: choices.turn4 ?? 'A',
        turn5: choices.turn5 ?? 'A',
        turn6: choices.turn6 ?? 'A',
        turn7: choices.turn7 ?? 'A',
      },
      role
    );

    playEndingFanfare(muted, finalized.ending.id);
    setFinalResult(finalized);
    setPhase('result');
    void persistResult(finalized);
  }, [
    selectedOptionKey,
    muted,
    turnNumber,
    automationLevel,
    role,
    metrics,
    choices,
    persistResult,
  ]);

  return (
    <>
      <FxOverlay trigger={fxTrigger} />
      {phase === 'start' && (
        <StartScreen
          studentId={studentId}
          studentName={studentName}
          selectedRole={role}
          muted={muted}
          onChangeStudentId={setStudentId}
          onChangeStudentName={setStudentName}
          onSelectRole={handleSelectRole}
          onToggleMute={handleToggleMute}
          onStart={handleStartRun}
          onOpenAdmin={() => {
            playClickSound(muted);
            setPhase('admin');
          }}
        />
      )}

      {phase === 'turn' && (
        <TurnScreen
          studentId={studentId}
          studentName={studentName}
          role={role}
          turnNumber={turnNumber}
          metrics={metrics}
          lastDeltas={lastDeltas}
          lastEfficiencyDelta={lastEfficiencyDelta}
          automationLevel={automationLevel}
          selectedOptionKey={selectedOptionKey}
          turn2AutoProfitBadge={turn2AutoProfitBadge}
          muted={muted}
          onToggleMute={handleToggleMute}
          onSelectOption={handleSelectOption}
          onNext={handleNextTurn}
          onReset={handleReset}
        />
      )}

      {phase === 'result' && finalResult && (
        <ResultScreen
          studentId={studentId}
          studentName={studentName}
          result={finalResult}
          saveStatus={saveStatus}
          saveError={saveError}
          muted={muted}
          onToggleMute={handleToggleMute}
          onRetrySave={() => {
            if (finalResult) {
              void persistResult(finalResult);
            }
          }}
          onReset={handleReset}
        />
      )}

      {phase === 'admin' && (
        <AdminScreen
          onBackToGame={() => {
            playClickSound(muted);
            setPhase('start');
          }}
        />
      )}
    </>
  );
}
