import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONFIG,
  applyMetricStep,
  calculateCombinedEfficiency,
  createInitialMetrics,
  runSelfTest,
  simulateFullRun,
  type AutomationLevel,
  type ChoiceLetter,
  type RoleType,
} from './engine';

test('runSelfTest 7-turn 4-choice official paths all PASS', () => {
  const { allPassed, results } = runSelfTest();
  for (const r of results) {
    assert.equal(r.passed, true, `${r.name} failed: ${r.details}`);
  }
  assert.equal(allPassed, true);
});

test('all 7 turns have exactly 4 choices and mixed order (not monotonic)', () => {
  const turnLists = [
    CONFIG.turn1.options,
    CONFIG.turn2.options,
    CONFIG.turn3.options,
    CONFIG.turn4.options,
    CONFIG.turn5.options,
    CONFIG.turn6.options,
    CONFIG.turn7.options,
    CONFIG.workerScenario.turn1.options,
    CONFIG.workerScenario.turn2.options,
    CONFIG.workerScenario.turn3.options,
    CONFIG.workerScenario.turn4.options,
    CONFIG.workerScenario.turn5.options,
    CONFIG.workerScenario.turn6.options,
    CONFIG.workerScenario.turn7.options,
  ];
  for (const opts of turnLists) {
    assert.equal(opts.length, 4);
  }

  // Verify the co-growth (positive) option isn't fixed at the same index across turns
  const ceoPositiveIndices = [
    CONFIG.turn1.options.findIndex((o) => o.outcome.severity === 'positive'),
    CONFIG.turn2.options.findIndex((o) => o.outcome.severity === 'positive'),
    CONFIG.turn3.options.findIndex((o) => o.outcome.severity === 'positive'),
    CONFIG.turn4.options.findIndex((o) => o.outcome.severity === 'positive'),
    CONFIG.turn5.options.findIndex((o) => o.outcome.severity === 'positive'),
    CONFIG.turn6.options.findIndex((o) => o.outcome.severity === 'positive'),
    CONFIG.turn7.options.findIndex((o) => o.outcome.severity === 'positive'),
  ];
  assert.ok(new Set(ceoPositiveIndices).size >= 3, 'Positive options should be mixed across indices');
});

test('all 7-turn x 4-choice combinations across CEO and Worker stay within [0, 100]', () => {
  const levels: AutomationLevel[] = [0, 1, 2, 3];
  const choices: ChoiceLetter[] = ['A', 'B', 'C', 'D'];
  const roles: RoleType[] = ['ceo', 'worker'];

  for (const role of roles) {
    for (const l of levels) {
      for (const c2 of choices) {
        for (const c3 of choices) {
          for (const c4 of choices) {
            for (const c5 of choices) {
              for (const c6 of choices) {
                for (const c7 of choices) {
                  const res = simulateFullRun(l, c2, c3, c4, c5, c6, c7, role);
                  for (const val of Object.values(res.metrics)) {
                    assert.ok(Number.isFinite(val) && val >= 0 && val <= 100);
                  }
                  assert.ok(
                    Number.isFinite(res.combinedEfficiency) &&
                      res.combinedEfficiency >= 0 &&
                      res.combinedEfficiency <= 100
                  );
                }
              }
            }
          }
        }
      }
    }
  }
});

test('income linkage computes 0.6 * deltaE before clamping', () => {
  const init = createInitialMetrics();
  const { next } = applyMetricStep(init, { E: -20 });
  assert.equal(next.E, 50);
  assert.equal(next.C, 58); // 70 - 12
});

test('balanced 7-turn strategy beats extreme profit-only strategy on combinedEfficiency', () => {
  const balanced = simulateFullRun(2, 'B', 'A', 'D', 'A', 'B', 'C', 'ceo');
  const extreme = simulateFullRun(3, 'A', 'B', 'B', 'C', 'D', 'D', 'ceo');
  assert.ok(
    balanced.combinedEfficiency > extreme.combinedEfficiency,
    `Expected balanced (${balanced.combinedEfficiency}) > extreme (${extreme.combinedEfficiency})`
  );
  assert.equal(
    calculateCombinedEfficiency(balanced.corporateScore, balanced.socialScore),
    balanced.combinedEfficiency
  );
});
