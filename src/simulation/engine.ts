import type { EffectSeverity } from '../utils/fx';

export type RoleType = 'ceo' | 'worker';
export type MetricKey = 'Pd' | 'Pf' | 'E' | 'C' | 'D' | 'A' | 'S';
export type AutomationLevel = 0 | 1 | 2 | 3;
export type ChoiceLetter = 'A' | 'B' | 'C' | 'D';
export type TurnNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Metrics {
  Pd: number; // 생산성
  Pf: number; // 이윤
  E: number;  // 고용
  C: number;  // 소득·소비
  D: number;  // 개인정보 보호
  A: number;  // AI 안전
  S: number;  // 인간 전문성
}

export type MetricDeltas = Partial<Record<MetricKey, number>>;

export interface EndingInfo {
  id: string;
  title: string;
  description: string;
}

export interface RoleplayOutcome {
  headline: string;
  reactionSpeaker: string;
  reactionLine: string;
  severity: EffectSeverity;
}

export interface RunChoices {
  turn1: AutomationLevel;
  turn2: ChoiceLetter;
  turn3: ChoiceLetter;
  turn4: ChoiceLetter;
  turn5: ChoiceLetter;
  turn6: ChoiceLetter;
  turn7: ChoiceLetter;
}

export interface RunResult {
  role: RoleType;
  metrics: Metrics;
  rawMetricsBeforeFeedback: Metrics;
  longTermFeedbackPenalty: number;
  corporateScore: number;
  socialScore: number;
  combinedEfficiency: number;
  gap: number;
  ending: EndingInfo;
  automationLevel: AutomationLevel;
  choices: RunChoices;
}

// ============================================================================
// CONFIG: 모든 수치, 가중치, 문장, 7턴 × 4지선다 시나리오(순서 혼합)
// ============================================================================
export const CONFIG = {
  totalTurns: 7,
  bounds: {
    min: 0,
    max: 100,
  },
  initialMetrics: {
    Pd: 50,
    Pf: 50,
    E: 70,
    C: 70,
    D: 70,
    A: 70,
    S: 70,
  } as Metrics,
  metricMeta: [
    { key: 'Pd' as MetricKey, label: '생산성', code: 'Pd', group: 'corporate' as const },
    { key: 'Pf' as MetricKey, label: '이윤', code: 'Pf', group: 'corporate' as const },
    { key: 'E' as MetricKey, label: '고용', code: 'E', group: 'social' as const },
    { key: 'C' as MetricKey, label: '소득·소비', code: 'C', group: 'social' as const },
    { key: 'D' as MetricKey, label: '개인정보 보호', code: 'D', group: 'social' as const },
    { key: 'A' as MetricKey, label: 'AI 안전', code: 'A', group: 'social' as const },
    { key: 'S' as MetricKey, label: '인간 전문성', code: 'S', group: 'social' as const },
  ],
  weights: {
    corporate: {
      Pd: 0.4,
      Pf: 0.6,
    },
    socialCount: 5,
    incomeLinkRatio: 0.6,
    longTermFeedbackThreshold: 50,
    longTermFeedbackPenaltyRatio: 0.3,
    endingGapThreshold: 15,
    endingCoGrowthMinScore: 55,
  },
  roles: [
    {
      id: 'ceo' as RoleType,
      title: '기업가 (한빛정밀 대표)',
      subtitle: '회사의 생산성과 돈을 키우는 사장님 입장',
      description: 'AI 로봇을 얼마나 들이고, 직원과 안전을 어떻게 챙길지 결정합니다.',
      image: '/src/assets/images/char_ceo_portrait_1795512716493.jpg',
    },
    {
      id: 'worker' as RoleType,
      title: '노동자 (현장 기술자)',
      subtitle: '일자리와 월급, 안전을 지키는 직원 입장',
      description: 'AI가 들어오는 공장에서 교육, 안전, 일자리를 지키기 위해 선택합니다.',
      image: '/src/assets/images/char_veteran_portrait_1795512718097.jpg',
    },
  ],
  copy: {
    appTitle: '한빛정밀 CEO — 우리 공장의 선택',
    brandName: '한빛정밀',
    startIntro:
      "정부가 '제조AI 2030 전략'을 발표했습니다. 당신은 직원 100명이 일하는 지역 공장 '한빛정밀'의 대표입니다. 아직 사람 손으로 만드는 일이 많은 우리 공장, 7번의 선택으로 미래를 정해 보세요!",
    workerStartIntro:
      "정부가 '제조AI 2030 전략'을 발표했습니다. 당신은 직원 100명이 일하는 지역 공장 '한빛정밀'의 현장 직원입니다. 공장에 AI와 로봇이 들어오려는 지금, 7번의 선택으로 일터와 사회의 미래를 정해 보세요!",
    startButton: '시작하기',
    nextButton: '다음',
    finishButton: '결과 보기',
    resetButton: '처음부터',
    disclaimer: '이 게임은 단순화한 모형이며 수치는 가정값입니다.',
    inquiryPrompt: '기업의 효율성이 높아지면 사회 전체의 효율성도 높아질까?',
    resultReflectQuestion:
      '내가 내린 선택은 기업 효율성과 사회 효율성에 각각 어떤 영향을 주었나요?',
  },
  // 기업가 시나리오 (7턴 × 4선택지, 좋고 나쁜 순서 혼합)
  turn1: {
    turnNumber: 1,
    title: 'AI·로봇을 얼마나 들일까?',
    situation:
      '물건을 사 가는 회사에서 "더 빨리 만들어 주세요!"라고 합니다. 우리 공장에 AI와 로봇을 얼마나 들일까요?',
    options: [
      {
        level: 2 as AutomationLevel,
        label: '1. 핵심 공정 일부 자동화',
        subLabel: '포장·검사·단순 조립 절반만 AI와 로봇에게 맡긴다',
        deltas: { Pd: 15, Pf: 12, E: -7, D: -4, A: -3, S: -2 } as MetricDeltas,
        outcome: {
          headline: '생산성과 이익이 크게 올랐지만, 일부 직원의 자리가 줄어들었습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '작업 속도는 훨씬 빨라졌는데, 자리를 옮겨야 하는 동료들이 걱정됩니다.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        level: 3 as AutomationLevel,
        label: '2. 공장 전면 무인화',
        subLabel: '공장 일 거의 전부를 AI와 로봇에게 맡긴다',
        deltas: { Pd: 28, Pf: 24, E: -24, D: -14, A: -12, S: -12 } as MetricDeltas,
        outcome: {
          headline: '생산성과 회사 수익이 폭발적으로 늘었지만, 직원 24명 규모 일자리가 사라졌습니다.',
          reactionSpeaker: '박 반장',
          reactionLine: '기계는 엄청나게 빠른데, 당장 일터를 떠나는 동료 가족들은 어떻게 하나요...',
          severity: 'warning' as EffectSeverity,
        },
      },
      {
        level: 0 as AutomationLevel,
        label: '3. 도입 안 함',
        subLabel: '지금처럼 직원 100명이 손으로 만든다',
        deltas: { Pd: 0, Pf: 0, E: 0, D: 0, A: 0, S: 0 } as MetricDeltas,
        outcome: {
          headline: '직원 100명이 그대로 일합니다. 일자리는 지켰지만 빠른 납기 요구가 걱정됩니다.',
          reactionSpeaker: '박 반장',
          reactionLine: '사람 손이 믿음직하긴 한데, 밀려드는 주문을 제때 맞출 수 있을지 걱정이네요.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        level: 1 as AutomationLevel,
        label: '4. 안전 보조 로봇만 소규모 도입',
        subLabel: '무거운 짐 옮기기 같은 위험한 일만 로봇이 돕는다',
        deltas: { Pd: 10, Pf: 8, E: -2, D: -1, A: 2, S: 2 } as MetricDeltas,
        outcome: {
          headline: '고용 충격을 줄이면서도 생산성이 오르고 작업 현장도 한층 안전해졌습니다.',
          reactionSpeaker: '나 (대표)',
          reactionLine: '사람이 힘든 일만 로봇이 도와주니 직원들도 다치지 않고 속도가 나네요!',
          severity: 'positive' as EffectSeverity,
        },
      },
    ],
  },
  turn2: {
    turnNumber: 2,
    title: '경쟁 회사가 가격을 깎았다!',
    introByLevel: {
      0: {
        text: '외국 경쟁 회사가 물건 값을 15%나 내렸습니다. 사람 손이 많이 가는 우리 공장은 가격을 맞추기가 매우 어렵습니다.',
        badge: '이윤 −10',
        profitDelta: -10,
      },
      1: {
        text: '외국 경쟁 회사가 물건 값을 15% 내렸습니다. 보조 로봇 덕분에 버티긴 하지만 아직 비용 부담이 있습니다.',
        badge: '이윤 −5',
        profitDelta: -5,
      },
      2: {
        text: '외국 경쟁 회사가 물건 값을 15% 내렸습니다. 일부 자동화 라인 덕분에 어느 정도 맞설 수 있습니다.',
        badge: '이윤 −2',
        profitDelta: -2,
      },
      3: {
        text: '외국 경쟁 회사가 물건 값을 15% 내렸습니다. 전면 자동화 공장 덕분에 가격 경쟁은 거뜬합니다.',
        badge: '이윤 0',
        profitDelta: 0,
      },
    } as Record<AutomationLevel, { text: string; badge: string; profitDelta: number }>,
    options: [
      {
        choice: 'A' as ChoiceLetter,
        label: 'A. 직원을 더 줄여서 인건비를 아낀다',
        deltas: { Pf: 10, Pd: 0, E: -12, S: 0 } as MetricDeltas,
        outcome: {
          headline: '아낀 인건비만큼 이익은 늘었지만, 실직이 늘어 지역 경제가 얼어붙습니다.',
          reactionSpeaker: '나 (대표)',
          reactionLine: '당장 회사 통장에는 돈이 남았지만, 직원들이 불안해하는 게 느껴집니다.',
          severity: 'warning' as EffectSeverity,
        },
      },
      {
        choice: 'B' as ChoiceLetter,
        label: 'B. 더 좋은 제품에 투자하고 직원을 재교육한다',
        deltas: { Pf: -2, Pd: 5, E: 4, S: 6 } as MetricDeltas,
        outcome: {
          headline: '교육비로 이익이 살짝 줄었지만, 회사 기술력과 일자리가 함께 커졌습니다.',
          reactionSpeaker: '박 반장',
          reactionLine: '지금은 돈이 들어도, 직원 실력이 늘면 나중에 훨씬 큰 힘이 됩니다!',
          severity: 'positive' as EffectSeverity,
        },
      },
      {
        choice: 'C' as ChoiceLetter,
        label: 'C. 큰 투자 없이 잔업으로 물량만 겨우 맞춘다',
        deltas: { Pf: 2, Pd: -2, E: 0, S: -3 } as MetricDeltas,
        outcome: {
          headline: '당장 급한 불은 껐지만 피로가 쌓여 생산성과 현장 기술이 조금 떨어졌습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '버티긴 했는데, 계속 야근만 해서는 오래 버틸 수 없을 것 같습니다.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        choice: 'D' as ChoiceLetter,
        label: 'D. 직원은 자르지 않고 일손이 필요한 부서로 옮긴다',
        deltas: { Pf: 1, Pd: 1, E: 1, S: 3 } as MetricDeltas,
        outcome: {
          headline: '해고 없이 부서를 옮겨 주어 고용을 지키고 다방면 실력이 늘었습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '큰 돈은 안 남았지만, 다 같이 일터를 지켰다는 안도감이 큽니다.',
          severity: 'mixed' as EffectSeverity,
        },
      },
    ],
  },
  turn3: {
    turnNumber: 3,
    title: 'AI 실수와 직원 정보 유출 사건',
    severityByLevel: {
      0: 0.3,
      1: 0.6,
      2: 1.1,
      3: 1.7,
    } as Record<AutomationLevel, number>,
    baseAccidentImpact: {
      D: -10,
      A: -12,
    },
    introByLevel: {
      0: '종이 서류가 잠시 뒤섞이는 작은 실수가 났습니다. 금방 바로잡을 수 있습니다.',
      1: '보조 로봇 센서가 일시 멈추고, 직원의 출입 기록 파일이 사내 다른 팀으로 잘못 전송됐습니다.',
      2: 'AI 검사기가 멀쩡한 제품을 불량이라고 착각했고, 직원의 이동 기록이 외부 업체로 잘못 넘어갔습니다.',
      3: '무인 로봇이 갑자기 멈추면서 불량품이 대량으로 팔려 나갔고, 직원 영상 정보가 바깥으로 유출됐습니다.',
    } as Record<AutomationLevel, string>,
    options: [
      {
        choice: 'A' as ChoiceLetter,
        label: 'A. 사람이 한 번 더 확인하는 안전 규칙과 보안에 투자한다',
        k: 0.4,
        deltas: { Pf: -4, S: 4, E: 3 } as MetricDeltas,
        outcome: {
          headline: '보안·안전 인력을 늘려 비용은 들었지만, 사고 피해를 최소로 줄이고 신뢰를 얻었습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '사람이 한 번 더 확인하니까 현장에서도 안심하고 일할 수 있습니다.',
          severity: 'positive' as EffectSeverity,
        },
      },
      {
        choice: 'B' as ChoiceLetter,
        label: 'B. 알리지 않고 조용히 공장부터 다시 돌린다',
        k: 1.5,
        deltas: { Pf: 5, S: 0, E: 0 } as MetricDeltas,
        outcome: {
          headline: '물건 파는 데는 지장이 없었지만, 개인정보와 AI 안전 점수가 크게 떨어졌습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '잠깐 돈은 지켰지만, 사고가 커지면 회사가 큰 신뢰를 잃을 텐데요...',
          severity: 'warning' as EffectSeverity,
        },
      },
      {
        choice: 'C' as ChoiceLetter,
        label: 'C. 원인을 찾을 때까지 공장 가동을 며칠 완전히 멈춘다',
        k: 0.15,
        deltas: { Pf: -10, Pd: -4, S: 3, E: 2 } as MetricDeltas,
        outcome: {
          headline: '사고 위험과 정보 유출은 철저히 막았지만, 매출 손실이 꽤 컸습니다.',
          reactionSpeaker: '박 반장',
          reactionLine: '안전은 확실히 챙겼는데, 며칠 쉬는 동안 거래처 눈치가 보이네요.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        choice: 'D' as ChoiceLetter,
        label: 'D. 솔직히 알리고 피해 본 곳에 보상하며 원인을 찾는다',
        k: 0.6,
        deltas: { Pf: -3, S: 1, E: 0 } as MetricDeltas,
        outcome: {
          headline: '보상금 때문에 이익은 조금 줄었지만, 솔직한 대처로 큰 피해를 막아냈습니다.',
          reactionSpeaker: '나 (대표)',
          reactionLine: '돈이 조금 들더라도 숨기지 않고 바로잡는 게 맞다고 판단했습니다.',
          severity: 'mixed' as EffectSeverity,
        },
      },
    ],
  },
  turn4: {
    turnNumber: 4,
    title: '베테랑 기술자의 은퇴',
    severityByLevel: {
      0: 0.5,
      1: 0.8,
      2: 1.1,
      3: 1.6,
    } as Record<AutomationLevel, number>,
    introByLevel: {
      0: '30년 동안 일한 베테랑 반장님이 곧 은퇴합니다. 그분의 손기술이 아직 글로 남아 있지 않습니다.',
      1: '보조 로봇이 고장 신호를 띄워도, 왜 그런지 원리를 아는 신입 직원이 적습니다.',
      2: 'AI가 고장 이유를 알려 주지만, 신입 직원은 왜 고장 났는지 모른 채 버튼만 누릅니다.',
      3: 'AI가 거의 모든 판단을 내립니다. 이제 현장에는 AI가 틀렸을 때 알아챌 사람이 드뭅니다.',
    } as Record<AutomationLevel, string>,
    options: [
      {
        choice: 'A' as ChoiceLetter,
        label: 'A. 따로 대책을 세우지 않고 그대로 둔다',
        deltas: { Pd: 0, Pf: 0, E: 0 } as MetricDeltas,
        expertiseMultiplier: -6,
        outcome: {
          headline: '시간이 지나면서 베테랑의 노하우가 조금씩 사라지고 있습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '당장은 조용하지만, 나중에 큰 고장이 나면 누가 해결할지 걱정입니다.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        choice: 'B' as ChoiceLetter,
        label: 'B. 이제 AI에게 맡기고 베테랑 인력을 내보낸다',
        deltas: { Pd: 7, Pf: 7, E: -6 } as MetricDeltas,
        expertiseMultiplier: -10,
        outcome: {
          headline: '월급이 높은 숙련 직원을 줄여 이익은 늘었지만, 인간의 현장 기술이 크게 사라졌습니다.',
          reactionSpeaker: '박 반장',
          reactionLine: '이제 공장에선 AI가 엉뚱한 답을 내놔도 고칠 줄 아는 사람이 없겠군요.',
          severity: 'warning' as EffectSeverity,
        },
      },
      {
        choice: 'C' as ChoiceLetter,
        label: 'C. 외부 전문가를 불러 종이 매뉴얼만 정리한다',
        deltas: { Pd: 2, Pf: -3, E: 0, S: 2 } as MetricDeltas,
        expertiseMultiplier: 0,
        outcome: {
          headline: '설명서 책자는 남겼지만, 직접 손으로 익히는 살아 있는 기술 전수는 부족합니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '책으로만 봐서는 실제 기계 소리를 구별하기가 쉽지 않네요.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        choice: 'D' as ChoiceLetter,
        label: 'D. 베테랑이 후배를 가르치고, AI는 도우미로만 쓴다',
        deltas: { Pd: 4, Pf: 2, E: 2, S: 6 } as MetricDeltas,
        expertiseMultiplier: 0,
        outcome: {
          headline: '선배의 손기술이 후배에게 이어지고, AI와 사람이 함께 일하며 기술력이 올랐습니다.',
          reactionSpeaker: '박 반장',
          reactionLine: 'AI가 도와주고 사람이 최종 확인하니 신입들도 일의 원리를 깨우치네요!',
          severity: 'positive' as EffectSeverity,
        },
      },
    ],
  },
  turn5: {
    turnNumber: 5,
    title: '직원을 지켜보는 감시 AI',
    situation:
      '작업 속도를 더 끌어올리기 위해, 직원이 몇 분 쉬는지와 움직임을 실시간으로 점수 매기는 AI 카메라를 달자고 합니다. 어떻게 할까요?',
    options: [
      {
        choice: 'A' as ChoiceLetter,
        label: 'A. 개인 감시는 빼고, 다치는 걸 막는 안전 기능만 켠다',
        deltas: { Pd: 4, Pf: 2, D: -2, A: 6, S: 2 } as MetricDeltas,
        outcome: {
          headline: '사생활 침해는 줄이면서 위험한 순간을 막아 AI 안전 점수가 올랐습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '사람을 감시하는 게 아니라 위험할 때 경고해 주니 모두가 반깁니다.',
          severity: 'positive' as EffectSeverity,
        },
      },
      {
        choice: 'B' as ChoiceLetter,
        label: 'B. 믿고 일하는 게 중요하다! 감시 AI는 달지 않는다',
        deltas: { Pd: -2, Pf: -2, D: 8, A: 2, S: 3 } as MetricDeltas,
        outcome: {
          headline: '속도는 조금 느리지만 개인정보 보호와 현장 신뢰가 크게 올라갔습니다.',
          reactionSpeaker: '박 반장',
          reactionLine: '사장님이 우리를 믿어 주시니 더 책임감을 갖고 꼼꼼하게 일하게 됩니다.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        choice: 'C' as ChoiceLetter,
        label: 'C. 속도가 중요하다! 감시 AI를 전부 설치한다',
        deltas: { Pd: 9, Pf: 7, D: -15, A: -5, S: -5 } as MetricDeltas,
        outcome: {
          headline: '작업 속도와 이익은 올랐지만, 24시간 감시 때문에 직원 사생활 보호가 크게 무너졌습니다.',
          reactionSpeaker: '박 반장',
          reactionLine: '화장실 가는 시간까지 점수로 매기니 로봇이 된 기분이라 일할 맛이 안 납니다.',
          severity: 'warning' as EffectSeverity,
        },
      },
      {
        choice: 'D' as ChoiceLetter,
        label: 'D. 개인 감시 대신 팀별 하루 생산량만 확인한다',
        deltas: { Pd: 2, Pf: 1, D: 2, A: 1, S: 1 } as MetricDeltas,
        outcome: {
          headline: '개인 사생활은 지키면서 팀끼리 협력해 무난하게 목표를 맞췄습니다.',
          reactionSpeaker: '나 (대표)',
          reactionLine: '일일이 감시하지 않아도 팀 단위로 챙기니 분위기가 괜찮네요.',
          severity: 'mixed' as EffectSeverity,
        },
      },
    ],
  },
  turn6: {
    turnNumber: 6,
    title: '회사가 번 돈, 누구와 나눌까?',
    situation:
      'AI 덕분에 아낀 돈과 회사 수익을 어디에 쓸지 결정할 때가 왔습니다. 회사의 이익을 어떻게 나누면 좋을까요?',
    options: [
      {
        choice: 'A' as ChoiceLetter,
        label: 'A. 직원 월급을 크게 올리고 지역 청년을 더 뽑는다',
        deltas: { Pf: -6, Pd: 3, E: 7, C: 8, S: 3 } as MetricDeltas,
        outcome: {
          headline: '회사 이익은 줄었지만, 지역 일자리와 소비가 크게 늘어나 사회가 활기를 띱니다.',
          reactionSpeaker: '박 반장',
          reactionLine: '젊은 친구들이 새로 들어오고 월급도 오르니 공장과 동네가 다 활기찹니다!',
          severity: 'positive' as EffectSeverity,
        },
      },
      {
        choice: 'B' as ChoiceLetter,
        label: 'B. 회사 성장 자금과 직원 성과급을 반반 나눈다',
        deltas: { Pf: 5, Pd: 3, E: 3, C: 6 } as MetricDeltas,
        outcome: {
          headline: '회사도 성장하고 직원 소득·지역 소비도 함께 살아나 균형을 맞췄습니다.',
          reactionSpeaker: '나 (대표)',
          reactionLine: '회사가 번 돈을 함께 나누니 직원들 표정도 밝아지고 소비도 살아납니다.',
          severity: 'positive' as EffectSeverity,
        },
      },
      {
        choice: 'C' as ChoiceLetter,
        label: 'C. 보너스 대신 공장 식당·휴게실 환경만 조금 고친다',
        deltas: { Pf: 2, Pd: 1, E: 0, C: 1, S: 1 } as MetricDeltas,
        outcome: {
          headline: '회사 시설은 조금 깔끔해졌지만, 직원 월급과 지역 소비 변화는 크지 않습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '휴게실이 좋아진 건 고맙지만, 물가가 올라서 월급이 더 간절하긴 합니다.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        choice: 'D' as ChoiceLetter,
        label: 'D. 회사 통장에만 모으고 직원 보너스는 주지 않는다',
        deltas: { Pf: 10, Pd: 2, E: -3, C: -6 } as MetricDeltas,
        outcome: {
          headline: '회사 이익은 크게 늘었지만, 직원 월급이 제자리라 지역 상점과 소비가 줄어듭니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '회사는 돈을 많이 벌었다는데, 직원들 주머니가 얇아져 동네 가게도 한산하네요.',
          severity: 'warning' as EffectSeverity,
        },
      },
    ],
  },
  turn7: {
    turnNumber: 7,
    title: '마지막 약속 — 한빛정밀의 미래',
    situation:
      '마지막 선택입니다! 정부가 "안전하고 사람을 지키는 착한 AI 공장" 인증을 제안했습니다. 어떤 공장으로 나아갈까요?',
    options: [
      {
        choice: 'A' as ChoiceLetter,
        label: 'A. 수익이 적더라도 일자리와 사람 중심 공장을 선언한다',
        deltas: { Pd: 1, Pf: -5, E: 6, C: 4, D: 8, A: 8, S: 8 } as MetricDeltas,
        outcome: {
          headline: '사회 지표는 매우 높아졌지만, 기업 수익성 경쟁에서는 부담이 남았습니다.',
          reactionSpeaker: '박 반장',
          reactionLine: '사람이 대접받는 좋은 일터가 되었지만, 회사 수익도 잘 챙겨야 오래가겠죠.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        choice: 'B' as ChoiceLetter,
        label: 'B. 큰 약속 없이 지금 상태 그대로 조용히 운영한다',
        deltas: { Pd: 0, Pf: 1, E: 0, D: 0, A: 0, S: 0 } as MetricDeltas,
        outcome: {
          headline: '큰 문제도 큰 도약도 없이 지금까지 해 온 모습 그대로 마무리했습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '무난하게 지나갔지만, 앞으로 다가올 변화에 좀 더 준비가 필요해 보입니다.',
          severity: 'mixed' as EffectSeverity,
        },
      },
      {
        choice: 'C' as ChoiceLetter,
        label: 'C. AI 효율도 챙기고, 안전·개인정보 규칙도 함께 지킨다',
        deltas: { Pd: 4, Pf: 4, E: 2, D: 6, A: 8, S: 4 } as MetricDeltas,
        outcome: {
          headline: '기업 성장과 사회적 책임이 함께 균형을 맞추는 지속 가능한 공장이 되었습니다.',
          reactionSpeaker: '나 (대표)',
          reactionLine: '기업의 효율과 사회의 안전이 함께 갈 수 있는 길을 찾은 것 같습니다.',
          severity: 'positive' as EffectSeverity,
        },
      },
      {
        choice: 'D' as ChoiceLetter,
        label: 'D. 규칙에 묶이기 싫다! 오직 최대 효율·최대 수익만 추구한다',
        deltas: { Pd: 9, Pf: 10, E: -6, D: -8, A: -8, S: -6 } as MetricDeltas,
        outcome: {
          headline: '회사 효율과 이익은 최고치를 찍었지만, 일자리·안전·전문성 부담을 사회가 떠안았습니다.',
          reactionSpeaker: '이 대리',
          reactionLine: '숫자상 회사 효율은 최고인데, 과연 우리 동네와 사회도 함께 좋아진 걸까요?',
          severity: 'warning' as EffectSeverity,
        },
      },
    ],
  },

  // 노동자 시나리오 (7턴 × 4선택지, 좋고 나쁜 순서 혼합)
  workerScenario: {
    turn1: {
      turnNumber: 1,
      title: '공장에 AI·로봇이 들어온대요!',
      situation:
        '회사가 물건을 빨리 만들려고 AI와 로봇을 들이려 합니다. 현장 직원 대표로서 어떤 의견을 낼까요?',
      options: [
        {
          level: 2 as AutomationLevel,
          label: '1. 일부 공정 자동화 동의 · 부서 재배치',
          subLabel: '포장·검사 일부는 로봇에게 맡기고 직원은 다른 일을 배운다',
          deltas: { Pd: 14, Pf: 10, E: -4, D: -3, A: -2, S: 1 } as MetricDeltas,
          outcome: {
            headline: '해고 충격을 크게 줄이면서도 공장 생산성이 올라 노사 모두 한숨 돌렸습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '힘든 일은 로봇이 하고, 직원들은 기계를 관리하는 새 일을 배우기 시작했어요!',
            severity: 'positive' as EffectSeverity,
          },
        },
        {
          level: 3 as AutomationLevel,
          label: '2. 전면 무인화 찬성 · 단기 보너스 받기',
          subLabel: '회사가 원하는 대로 다 바꾸고 남은 사람 보너스를 올린다',
          deltas: { Pd: 25, Pf: 20, E: -22, D: -12, A: -10, S: -12 } as MetricDeltas,
          outcome: {
            headline: '회사 효율은 크게 올랐지만, 동료 22명이 일자리를 잃고 현장 불안이 커졌습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '보너스는 조금 올랐지만, 함께 일하던 동료들이 떠나서 마음이 아픕니다.',
            severity: 'warning' as EffectSeverity,
          },
        },
        {
          level: 0 as AutomationLevel,
          label: '3. 도입 전면 반대 · 100명 일자리 지키기',
          subLabel: '지금처럼 100명 모두 사람 손으로 일하게 해 달라고 요구한다',
          deltas: { Pd: -2, Pf: -3, E: 4, D: 2, A: 2, S: 4 } as MetricDeltas,
          outcome: {
            headline: '일자리와 기술은 지켰지만, 회사가 납기와 돈을 맞추기 어려워집니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '일터는 지켰지만, 회사가 경쟁에서 버틸 수 있을지 같이 고민해야겠네요.',
            severity: 'mixed' as EffectSeverity,
          },
        },
        {
          level: 1 as AutomationLevel,
          label: '4. 위험한 일만 AI 보조 로봇에 맡기기',
          subLabel: '무거운 짐 운반과 위험 작업만 로봇이 돕도록 제안한다',
          deltas: { Pd: 9, Pf: 6, E: -1, D: -1, A: 3, S: 3 } as MetricDeltas,
          outcome: {
            headline: '동료 일자리는 거의 지키면서 작업 안전성과 생산성이 함께 좋아졌습니다.',
            reactionSpeaker: '나 (박 반장)',
            reactionLine: '허리 다칠 걱정 없이 일하면서도 물량이 잘 나오니 모두가 만족하네요!',
            severity: 'positive' as EffectSeverity,
          },
        },
      ],
    },
    turn2: {
      turnNumber: 2,
      title: '월급 동결과 야근 압박이 왔다!',
      introByLevel: {
        0: {
          text: '외국 회사가 값을 내리면서 회사 이익이 크게 줄어, 직원들에게 월급 동결과 야근을 요구하고 있습니다.',
          badge: '이윤 −8',
          profitDelta: -8,
        },
        1: {
          text: '외국 회사의 가격 공세로 회사 사정이 빠듯해져 직원들에게 근무 시간 연장을 부탁하고 있습니다.',
          badge: '이윤 −4',
          profitDelta: -4,
        },
        2: {
          text: '일부 자동화 라인이 버텨 주고 있지만, 남은 직원들의 일의 양이 부쩍 늘었습니다.',
          badge: '이윤 −2',
          profitDelta: -2,
        },
        3: {
          text: '로봇 공장 덕에 회사 가격은 맞췄지만, 소수 남은 직원들에게 감시와 책임이 몰리고 있습니다.',
          badge: '이윤 0',
          profitDelta: 0,
        },
      } as Record<AutomationLevel, { text: string; badge: string; profitDelta: number }>,
      options: [
        {
          choice: 'A' as ChoiceLetter,
          label: 'A. 회사를 위해 월급 동결과 추가 야근을 받아들인다',
          deltas: { Pf: 9, Pd: 4, E: -4, S: -5 } as MetricDeltas,
          outcome: {
            headline: '회사 이익은 늘었지만, 피로가 쌓여 현장 기술력과 일자리가 줄어듭니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '회사 급한 불은 껐지만, 이렇게 무리하다간 직원들이 다 지칠 겁니다.',
            severity: 'warning' as EffectSeverity,
          },
        },
        {
          choice: 'B' as ChoiceLetter,
          label: 'B. AI 기계를 다루는 무료 재교육을 열어 달라고 요구한다',
          deltas: { Pf: -1, Pd: 6, E: 4, S: 7 } as MetricDeltas,
          outcome: {
            headline: '교육 비용으로 단기 이익은 살짝 줄었으나, 생산성·고용·전문성이 모두 올랐습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: 'AI 다루는 기술을 직접 배우니까 일자리를 잃을까 봐 떨지 않아도 됩니다!',
            severity: 'positive' as EffectSeverity,
          },
        },
        {
          choice: 'C' as ChoiceLetter,
          label: 'C. 아무 말 없이 정해진 근무 시간만 채우고 퇴근한다',
          deltas: { Pf: -2, Pd: -2, E: 0, S: -1 } as MetricDeltas,
          outcome: {
            headline: '당장 충돌은 피했지만 회사와 직원 모두 뾰족한 해결책을 찾지 못했습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '조용히 지나가긴 했는데, 회사 물량이 밀려 불안하네요.',
            severity: 'mixed' as EffectSeverity,
          },
        },
        {
          choice: 'D' as ChoiceLetter,
          label: 'D. 근무 시간을 나누고 서로 일을 번갈아 맡자고 제안한다',
          deltas: { Pf: 1, Pd: 2, E: 2, S: 3 } as MetricDeltas,
          outcome: {
            headline: '무리한 야근 대신 일을 나누어 고용과 현장 실력을 안정적으로 지켰습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '서로 다른 일도 배워 두니 일터 분위기가 훨씬 안정됐습니다.',
            severity: 'mixed' as EffectSeverity,
          },
        },
      ],
    },
    turn3: {
      turnNumber: 3,
      title: 'AI 오작동과 내 정보 유출!',
      severityByLevel: {
        0: 0.3,
        1: 0.6,
        2: 1.1,
        3: 1.7,
      } as Record<AutomationLevel, number>,
      introByLevel: {
        0: '종이 작업표가 잠깐 꼬여 일정이 밀렸습니다. 동료들과 금방 정리할 수 있습니다.',
        1: '보조 로봇 센서가 삐끗해 경보가 울렸고, 직원 출입 명단이 잘못 공유됐습니다.',
        2: 'AI 검사기 실수를 직원 탓으로 돌렸고, 직원들의 출퇴근·이동 기록이 외부 업체로 빠져나갔습니다.',
        3: '무인 로봇이 멈춰 큰 사고가 날 뻔했고, 공장 안 직원 영상과 건강 기록이 동의 없이 유출됐습니다.',
      } as Record<AutomationLevel, string>,
      options: [
        {
          choice: 'A' as ChoiceLetter,
          label: 'A. 회사와 직원이 함께 AI 안전·정보 지킴이 팀을 만든다',
          k: 0.4,
          deltas: { Pf: -3, S: 4, E: 3 } as MetricDeltas,
          outcome: {
            headline: '함께 지키는 안전 시스템이 생겨 사고 피해를 최소화하고 현장 신뢰가 올라갔습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '직원이 직접 안전 점검에 참여하니 공장이 훨씬 믿음직해졌습니다!',
            severity: 'positive' as EffectSeverity,
          },
        },
        {
          choice: 'B' as ChoiceLetter,
          label: 'B. 괜히 찍힐까 봐 무서워서 조용히 넘어간다',
          k: 1.5,
          deltas: { Pf: 4, S: -3, E: -2 } as MetricDeltas,
          outcome: {
            headline: '기계는 계속 돌았지만, 직원의 개인정보와 AI 안전 점수가 크게 떨어졌습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '문제를 덮고 넘어가니 언제 또 사고가 날지 몰라 다들 불안해합니다.',
            severity: 'warning' as EffectSeverity,
          },
        },
        {
          choice: 'C' as ChoiceLetter,
          label: 'C. 안전이 확인될 때까지 작업 거부를 선언한다',
          k: 0.15,
          deltas: { Pf: -9, Pd: -4, S: 2, E: 1 } as MetricDeltas,
          outcome: {
            headline: '위험 작업은 즉시 막아냈지만, 회사 생산 차질로 매출 타격이 컸습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '목숨보다 중요한 건 없지만, 회사가 버틸 수 있을지 걱정도 됩니다.',
            severity: 'mixed' as EffectSeverity,
          },
        },
        {
          choice: 'D' as ChoiceLetter,
          label: 'D. 유출과 실수를 알리고 제대로 고쳐 달라고 요구한다',
          k: 0.6,
          deltas: { Pf: -2, S: 2, E: 1 } as MetricDeltas,
          outcome: {
            headline: '회사는 수정 비용을 썼지만, 추가 정보 유출을 막고 안전 점검이 시작됐습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '목소리 내기 쉽지 않았지만, 안전 문제를 바로잡아야 모두가 삽니다.',
            severity: 'mixed' as EffectSeverity,
          },
        },
      ],
    },
    turn4: {
      turnNumber: 4,
      title: '선배의 손기술이 사라질 위기',
      severityByLevel: {
        0: 0.5,
        1: 0.8,
        2: 1.1,
        3: 1.6,
      } as Record<AutomationLevel, number>,
      introByLevel: {
        0: '30년 경력의 선배 기술자들이 곧 은퇴합니다. 현장 노하우를 가르쳐 줄 시간이 부족합니다.',
        1: '신입 직원들이 보조 로봇 조작만 익히고, 부품 상태를 직접 살피는 감각을 놓치고 있습니다.',
        2: '신입 직원들이 AI 화면 지시만 따라 하다 보니, 기계가 왜 이상한지 스스로 모릅니다.',
        3: 'AI가 모든 작업을 지시하면서, 현장 직원들이 직접 문제를 해결하는 힘이 빠르게 사라지고 있습니다.',
      } as Record<AutomationLevel, string>,
      options: [
        {
          choice: 'A' as ChoiceLetter,
          label: 'A. 내 일만 챙기며 지금 방식 그대로 버틴다',
          deltas: { Pd: 0, Pf: 0, E: 0 } as MetricDeltas,
          expertiseMultiplier: -6,
          outcome: {
            headline: '변화를 미루는 동안 선배들의 귀중한 노하우가 조용히 사라지고 있습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '오늘 하루는 버텼지만, 몇 년 뒤 우리 공장이 조금 걱정되네요.',
            severity: 'mixed' as EffectSeverity,
          },
        },
        {
          choice: 'B' as ChoiceLetter,
          label: 'B. 그냥 AI가 시키는 대로만 일하고 옛날 기술은 포기한다',
          deltas: { Pd: 6, Pf: 6, E: -5 } as MetricDeltas,
          expertiseMultiplier: -10,
          outcome: {
            headline: '당장 속도는 빨랐지만, 현장의 숙련 기술이 사라져 직원의 가치가 떨어집니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '평생 쌓아 온 기술이 버튼 하나에 밀려 사라지는 것 같아 아쉽군요.',
            severity: 'warning' as EffectSeverity,
          },
        },
        {
          choice: 'C' as ChoiceLetter,
          label: 'C. 틈날 때 선배 작업 사진만 몰래 찍어 참고한다',
          deltas: { Pd: 1, Pf: 0, E: 0, S: 1 } as MetricDeltas,
          expertiseMultiplier: -1,
          outcome: {
            headline: '조금씩 따라 해 보긴 하지만 체계적인 교육이 없어 실력이 더디게 늡니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '사진만 봐서는 손의 힘 조절까지 알기가 어렵네요.',
            severity: 'mixed' as EffectSeverity,
          },
        },
        {
          choice: 'D' as ChoiceLetter,
          label: 'D. 선배의 기술을 배우고, AI는 보조 도구로만 쓰자고 제안한다',
          deltas: { Pd: 4, Pf: 3, E: 3, S: 7 } as MetricDeltas,
          expertiseMultiplier: 0,
          outcome: {
            headline: '사람의 손기술과 AI가 어우러져 일자리와 현장 전문성이 크게 자라났습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '후배들이 기계 원리도 알고 AI도 잘 다루게 되니 정말 든든합니다!',
            severity: 'positive' as EffectSeverity,
          },
        },
      ],
    },
    turn5: {
      turnNumber: 5,
      title: '우리를 감시하는 AI 카메라',
      situation:
        '회사가 작업 속도를 높이겠다며 직원의 움직임과 쉬는 시간을 실시간으로 기록해 점수 매기는 AI 카메라를 달려고 합니다. 어떻게 대응할까요?',
      options: [
        {
          choice: 'A' as ChoiceLetter,
          label: 'A. 개인 감시는 빼고, 다치는 걸 막는 안전 알림만 켜자고 한다',
          deltas: { Pd: 4, Pf: 3, D: -2, A: 7, S: 2 } as MetricDeltas,
          outcome: {
            headline: '사생활은 지키면서 위험 사고를 예방해 AI 안전 점수가 크게 올랐습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '사람을 괴롭히는 기계가 아니라 지켜 주는 기계라면 얼마든지 환영이죠!',
            severity: 'positive' as EffectSeverity,
          },
        },
        {
          choice: 'B' as ChoiceLetter,
          label: 'B. 감시는 인권 침해! 카메라 설치 자체를 반대한다',
          deltas: { Pd: -2, Pf: -2, D: 9, A: 2, S: 3 } as MetricDeltas,
          outcome: {
            headline: '생산 속도는 살짝 내려갔지만, 직원의 사생활 보호와 자부심을 지켜냈습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '사람이 기계의 눈치를 보지 않고 일할 권리를 확실히 지켰습니다.',
            severity: 'mixed' as EffectSeverity,
          },
        },
        {
          choice: 'C' as ChoiceLetter,
          label: 'C. 수당을 조금 더 준다고 하니 감시 카메라를 받아들인다',
          deltas: { Pd: 8, Pf: 6, D: -15, A: -5, S: -5 } as MetricDeltas,
          outcome: {
            headline: '작업 속도는 빨라졌지만, 지나친 감시로 직원의 사생활 보호가 크게 무너졌습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '매 순간 감시당하면서 일하니까 숨이 막히고 실수가 더 잦아집니다.',
            severity: 'warning' as EffectSeverity,
          },
        },
        {
          choice: 'D' as ChoiceLetter,
          label: 'D. 개인 촬영 대신 하루 작업량 목표만 공유하자고 한다',
          deltas: { Pd: 2, Pf: 1, D: 2, A: 1, S: 1 } as MetricDeltas,
          outcome: {
            headline: '불필요한 감시 없이도 팀끼리 약속한 목표를 무난하게 달성했습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '카메라 감시 없이도 우리가 스스로 일정을 잘 지킬 수 있습니다.',
            severity: 'mixed' as EffectSeverity,
          },
        },
      ],
    },
    turn6: {
      turnNumber: 6,
      title: '회사가 번 돈, 직원과 나눌까?',
      situation:
        '회사가 비용 분배 회의를 열었습니다. AI 덕분에 아낀 돈과 수익을 어떻게 나누자고 목소리를 낼까요?',
      options: [
        {
          choice: 'A' as ChoiceLetter,
          label: 'A. 월급을 크게 올리고 청년 신입을 더 뽑아 달라고 요구한다',
          deltas: { Pf: -6, Pd: 3, E: 7, C: 8, S: 3 } as MetricDeltas,
          outcome: {
            headline: '회사 비용 부담은 늘었지만, 일자리와 소득·소비가 눈에 띄게 살아났습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '새 동료도 들어오고 지갑도 넉넉해져서 지역 경제에 활력이 돕니다.',
            severity: 'positive' as EffectSeverity,
          },
        },
        {
          choice: 'B' as ChoiceLetter,
          label: 'B. 회사와 직원이 성과를 똑같이 나누는 상생 안을 제안한다',
          deltas: { Pf: 4, Pd: 4, E: 3, C: 6 } as MetricDeltas,
          outcome: {
            headline: '회사도 크고 직원 월급과 지역 소비도 함께 늘어나 모두가 웃게 되었습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '회사가 잘될수록 직원도 같이 좋아지니 일할 의욕이 절로 생깁니다!',
            severity: 'positive' as EffectSeverity,
          },
        },
        {
          choice: 'C' as ChoiceLetter,
          label: 'C. 월급 대신 구내식당 밥만 더 맛있게 해 달라고 한다',
          deltas: { Pf: 2, Pd: 1, E: 0, C: 1, S: 1 } as MetricDeltas,
          outcome: {
            headline: '식사 만족도는 조금 올랐지만, 가계 소득과 지역 소비에는 큰 변화가 없습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '밥은 맛있어졌는데, 정작 가정 살림이 넉넉해지진 않았네요.',
            severity: 'mixed' as EffectSeverity,
          },
        },
        {
          choice: 'D' as ChoiceLetter,
          label: 'D. 회사 경쟁력이 먼저라며 월급 동결을 받아들인다',
          deltas: { Pf: 9, Pd: 2, E: -3, C: -6 } as MetricDeltas,
          outcome: {
            headline: '회사 통장은 두둑해졌지만, 직원 월급이 줄어들어 동네 상권과 소비가 위축됩니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '회사가 잘나가도 우리 생활이 나아지지 않으면 무슨 소용인가 싶네요.',
            severity: 'warning' as EffectSeverity,
          },
        },
      ],
    },
    turn7: {
      turnNumber: 7,
      title: '마지막 약속 — 우리가 바라는 일터',
      situation:
        '마지막 선택입니다! 앞으로 우리 한빛정밀이 어떤 일터가 되길 바라며 어떤 약속을 맺을까요?',
      options: [
        {
          choice: 'A' as ChoiceLetter,
          label: 'A. 수익보다 일자리 보장과 지역 상생을 최우선으로 삼는다',
          deltas: { Pd: 1, Pf: -5, E: 7, C: 4, D: 8, A: 8, S: 8 } as MetricDeltas,
          outcome: {
            headline: '일터와 사회 점수는 최고 수준이지만, 회사 수익성 경쟁이 과제로 남았습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '정말 따뜻하고 안전한 일터가 됐지만, 회사 매출도 잘 버텨 줘야 할 텐데요.',
            severity: 'mixed' as EffectSeverity,
          },
        },
        {
          choice: 'B' as ChoiceLetter,
          label: 'B. 별다른 약속 없이 지금처럼 하루하루 일한다',
          deltas: { Pd: 0, Pf: 1, E: 0, D: 0, A: 0, S: 0 } as MetricDeltas,
          outcome: {
            headline: '큰 갈등 없이 마무리됐지만, 미래를 위한 뚜렷한 안전장치는 남지 않았습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '무사히 지나갔지만 앞으로 AI 시대에 우리가 잘 버틸 수 있을지 생각하게 되네요.',
            severity: 'mixed' as EffectSeverity,
          },
        },
        {
          choice: 'C' as ChoiceLetter,
          label: 'C. AI 안전 규칙을 지키며 사람과 AI가 함께 크는 공장을 약속한다',
          deltas: { Pd: 5, Pf: 4, E: 3, D: 6, A: 8, S: 5 } as MetricDeltas,
          outcome: {
            headline: '회사 효율과 노동자의 안전·존엄이 조화를 이루는 건강한 공장이 되었습니다.',
            reactionSpeaker: '이 대리',
            reactionLine: '기업의 효율과 사회 전체의 행복이 함께 갈 수 있다는 걸 보여 주었네요!',
            severity: 'positive' as EffectSeverity,
          },
        },
        {
          choice: 'D' as ChoiceLetter,
          label: 'D. 회사가 알아서 수익을 내도록 다 회사 결정에 맡긴다',
          deltas: { Pd: 8, Pf: 9, E: -6, D: -7, A: -7, S: -6 } as MetricDeltas,
          outcome: {
            headline: '회사의 효율과 수익은 올랐지만, 일자리·안전·전문성은 크게 흔들렸습니다.',
            reactionSpeaker: '박 반장',
            reactionLine: '회사는 돈을 많이 벌었지만, 정작 일하는 사람의 삶은 더 팍팍해졌군요.',
            severity: 'warning' as EffectSeverity,
          },
        },
      ],
    },
  },
  endings: [
    {
      id: 'co_growth',
      title: '함께 성장한 공장',
      description: '기업과 사회가 함께 이익을 얻었습니다.',
    },
    {
      id: 'stagnant',
      title: '버티기만 한 공장',
      description: '큰 충돌은 없었지만 둘 다 크게 성장하지는 못했습니다.',
    },
    {
      id: 'corporate_only',
      title: '기업만 웃은 공장',
      description: '기업은 크게 성장했지만 일자리·안전·전문성의 부담은 사회가 졌습니다.',
    },
    {
      id: 'social_only',
      title: '사회엔 좋았지만 기업은 힘든 선택',
      description: '사회의 부담은 작았지만 기업이 경쟁에서 뒤처졌습니다.',
    },
  ] as EndingInfo[],
};

// ============================================================================
// Pure Calculation Helpers
// ============================================================================

export function clampMetric(value: number): number {
  if (!Number.isFinite(value)) return CONFIG.bounds.min;
  return Math.min(CONFIG.bounds.max, Math.max(CONFIG.bounds.min, value));
}

export function createInitialMetrics(): Metrics {
  return { ...CONFIG.initialMetrics };
}

export function applyMetricStep(
  current: Metrics,
  rawDeltas: MetricDeltas
): { next: Metrics; effectiveDeltas: Metrics; actualChanges: Metrics } {
  const adjusted: Record<MetricKey, number> = {
    Pd: rawDeltas.Pd ?? 0,
    Pf: rawDeltas.Pf ?? 0,
    E: rawDeltas.E ?? 0,
    C: rawDeltas.C ?? 0,
    D: rawDeltas.D ?? 0,
    A: rawDeltas.A ?? 0,
    S: rawDeltas.S ?? 0,
  };

  // 소득 연동: ΔE가 있을 때 0~100으로 자르기 전 ΔC도 0.6 × ΔE만큼 함께 변화
  if (adjusted.E !== 0) {
    adjusted.C += CONFIG.weights.incomeLinkRatio * adjusted.E;
  }

  const next: Metrics = {
    Pd: clampMetric(current.Pd + adjusted.Pd),
    Pf: clampMetric(current.Pf + adjusted.Pf),
    E: clampMetric(current.E + adjusted.E),
    C: clampMetric(current.C + adjusted.C),
    D: clampMetric(current.D + adjusted.D),
    A: clampMetric(current.A + adjusted.A),
    S: clampMetric(current.S + adjusted.S),
  };

  const actualChanges: Metrics = {
    Pd: next.Pd - current.Pd,
    Pf: next.Pf - current.Pf,
    E: next.E - current.E,
    C: next.C - current.C,
    D: next.D - current.D,
    A: next.A - current.A,
    S: next.S - current.S,
  };

  return { next, effectiveDeltas: adjusted, actualChanges };
}

export function getTurn1Deltas(level: AutomationLevel, role: RoleType = 'ceo'): MetricDeltas {
  const source = role === 'worker' ? CONFIG.workerScenario.turn1 : CONFIG.turn1;
  const opt = source.options.find((o) => o.level === level);
  if (!opt) throw new Error(`Invalid Turn 1 automation level: ${level}`);
  return { ...opt.deltas };
}

export function getTurn2IntroDelta(level: AutomationLevel, role: RoleType = 'ceo'): MetricDeltas {
  const source = role === 'worker' ? CONFIG.workerScenario.turn2 : CONFIG.turn2;
  const intro = source.introByLevel[level];
  return { Pf: intro.profitDelta };
}

export function getTurn2ChoiceDeltas(choice: ChoiceLetter, role: RoleType = 'ceo'): MetricDeltas {
  const source = role === 'worker' ? CONFIG.workerScenario.turn2 : CONFIG.turn2;
  const opt = source.options.find((o) => o.choice === choice);
  if (!opt) throw new Error(`Invalid Turn 2 choice: ${choice}`);
  return { ...opt.deltas };
}

export function getTurn3ChoiceDeltas(
  level: AutomationLevel,
  choice: ChoiceLetter,
  role: RoleType = 'ceo'
): MetricDeltas {
  const source = role === 'worker' ? CONFIG.workerScenario.turn3 : CONFIG.turn3;
  const m = source.severityByLevel[level];
  const opt = source.options.find((o) => o.choice === choice);
  if (!opt) throw new Error(`Invalid Turn 3 choice: ${choice}`);
  const k = opt.k;
  return {
    ...opt.deltas,
    D: CONFIG.turn3.baseAccidentImpact.D * m * k,
    A: CONFIG.turn3.baseAccidentImpact.A * m * k,
  };
}

export function getTurn4ChoiceDeltas(
  level: AutomationLevel,
  choice: ChoiceLetter,
  role: RoleType = 'ceo'
): MetricDeltas {
  const source = role === 'worker' ? CONFIG.workerScenario.turn4 : CONFIG.turn4;
  const s = source.severityByLevel[level];
  const opt = source.options.find((o) => o.choice === choice);
  if (!opt) throw new Error(`Invalid Turn 4 choice: ${choice}`);
  const deltas: MetricDeltas = { ...opt.deltas };
  if (opt.expertiseMultiplier !== 0) {
    deltas.S = opt.expertiseMultiplier * s;
  }
  return deltas;
}

export function getTurn5ChoiceDeltas(choice: ChoiceLetter, role: RoleType = 'ceo'): MetricDeltas {
  const source = role === 'worker' ? CONFIG.workerScenario.turn5 : CONFIG.turn5;
  const opt = source.options.find((o) => o.choice === choice);
  if (!opt) throw new Error(`Invalid Turn 5 choice: ${choice}`);
  return { ...opt.deltas };
}

export function getTurn6ChoiceDeltas(choice: ChoiceLetter, role: RoleType = 'ceo'): MetricDeltas {
  const source = role === 'worker' ? CONFIG.workerScenario.turn6 : CONFIG.turn6;
  const opt = source.options.find((o) => o.choice === choice);
  if (!opt) throw new Error(`Invalid Turn 6 choice: ${choice}`);
  return { ...opt.deltas };
}

export function getTurn7ChoiceDeltas(choice: ChoiceLetter, role: RoleType = 'ceo'): MetricDeltas {
  const source = role === 'worker' ? CONFIG.workerScenario.turn7 : CONFIG.turn7;
  const opt = source.options.find((o) => o.choice === choice);
  if (!opt) throw new Error(`Invalid Turn 7 choice: ${choice}`);
  return { ...opt.deltas };
}

export function applyLongTermFeedback(metrics: Metrics): {
  finalMetrics: Metrics;
  penalty: number;
} {
  const threshold = CONFIG.weights.longTermFeedbackThreshold;
  if (metrics.C < threshold) {
    const penalty = (threshold - metrics.C) * CONFIG.weights.longTermFeedbackPenaltyRatio;
    const finalPf = clampMetric(metrics.Pf - penalty);
    return {
      finalMetrics: { ...metrics, Pf: finalPf },
      penalty,
    };
  }
  return {
    finalMetrics: { ...metrics },
    penalty: 0,
  };
}

export function calculateCorporateScore(metrics: Metrics): number {
  return (
    CONFIG.weights.corporate.Pd * metrics.Pd +
    CONFIG.weights.corporate.Pf * metrics.Pf
  );
}

export function calculateSocialScore(metrics: Metrics): number {
  return (
    (metrics.E + metrics.C + metrics.D + metrics.A + metrics.S) /
    CONFIG.weights.socialCount
  );
}

export function calculateCombinedEfficiency(
  corporateScore: number,
  socialScore: number
): number {
  const safeCorp = Math.max(0, corporateScore);
  const safeSoc = Math.max(0, socialScore);
  return Math.sqrt(safeCorp * safeSoc);
}

export function determineEnding(corporateScore: number, socialScore: number): EndingInfo {
  const gap = corporateScore - socialScore;
  const absGap = Math.abs(gap);
  const gapThreshold = CONFIG.weights.endingGapThreshold;
  const minCoGrowth = CONFIG.weights.endingCoGrowthMinScore;

  if (absGap <= gapThreshold && corporateScore >= minCoGrowth && socialScore >= minCoGrowth) {
    return CONFIG.endings[0];
  }
  if (absGap <= gapThreshold) {
    return CONFIG.endings[1];
  }
  if (gap > gapThreshold) {
    return CONFIG.endings[2];
  }
  return CONFIG.endings[3];
}

export function finalizeRun(
  metricsAfterTurn7: Metrics,
  automationLevel: AutomationLevel,
  choices: RunChoices,
  role: RoleType = 'ceo'
): RunResult {
  const { finalMetrics, penalty } = applyLongTermFeedback(metricsAfterTurn7);
  const corporateScore = calculateCorporateScore(finalMetrics);
  const socialScore = calculateSocialScore(finalMetrics);
  const combinedEfficiency = calculateCombinedEfficiency(corporateScore, socialScore);
  const gap = corporateScore - socialScore;
  const ending = determineEnding(corporateScore, socialScore);

  return {
    role,
    metrics: finalMetrics,
    rawMetricsBeforeFeedback: { ...metricsAfterTurn7 },
    longTermFeedbackPenalty: penalty,
    corporateScore,
    socialScore,
    combinedEfficiency,
    gap,
    ending,
    automationLevel,
    choices,
  };
}

export function simulateFullRun(
  turn1Level: AutomationLevel,
  turn2Choice: ChoiceLetter,
  turn3Choice: ChoiceLetter,
  turn4Choice: ChoiceLetter,
  turn5Choice: ChoiceLetter,
  turn6Choice: ChoiceLetter,
  turn7Choice: ChoiceLetter,
  role: RoleType = 'ceo'
): RunResult {
  let current = createInitialMetrics();
  current = applyMetricStep(current, getTurn1Deltas(turn1Level, role)).next;
  current = applyMetricStep(current, getTurn2IntroDelta(turn1Level, role)).next;
  current = applyMetricStep(current, getTurn2ChoiceDeltas(turn2Choice, role)).next;
  current = applyMetricStep(current, getTurn3ChoiceDeltas(turn1Level, turn3Choice, role)).next;
  current = applyMetricStep(current, getTurn4ChoiceDeltas(turn1Level, turn4Choice, role)).next;
  current = applyMetricStep(current, getTurn5ChoiceDeltas(turn5Choice, role)).next;
  current = applyMetricStep(current, getTurn6ChoiceDeltas(turn6Choice, role)).next;
  current = applyMetricStep(current, getTurn7ChoiceDeltas(turn7Choice, role)).next;

  return finalizeRun(
    current,
    turn1Level,
    {
      turn1: turn1Level,
      turn2: turn2Choice,
      turn3: turn3Choice,
      turn4: turn4Choice,
      turn5: turn5Choice,
      turn6: turn6Choice,
      turn7: turn7Choice,
    },
    role
  );
}

// ============================================================================
// Self-Test Harness (Console Verifiable)
// ============================================================================
export interface SelfTestCaseResult {
  name: string;
  passed: boolean;
  corporateScore: number;
  socialScore: number;
  combinedEfficiency: number;
  ending: string;
  details?: string;
}

export function runSelfTest(): { allPassed: boolean; results: SelfTestCaseResult[] } {
  const specs: Array<{
    name: string;
    args: [AutomationLevel, ChoiceLetter, ChoiceLetter, ChoiceLetter, ChoiceLetter, ChoiceLetter, ChoiceLetter, RoleType];
    expectedEnding: string;
  }> = [
    {
      name: '기업가 극단 효율 경로 (3, A, B, B, C, D, D)',
      args: [3, 'A', 'B', 'B', 'C', 'D', 'D', 'ceo'],
      expectedEnding: '기업만 웃은 공장',
    },
    {
      name: '기업가 사회 보호 위주 경로 (0, D, C, D, B, A, A)',
      args: [0, 'D', 'C', 'D', 'B', 'A', 'A', 'ceo'],
      expectedEnding: '사회엔 좋았지만 기업은 힘든 선택',
    },
    {
      name: '기업가 균형 상생 경로 (2, B, A, D, A, B, C)',
      args: [2, 'B', 'A', 'D', 'A', 'B', 'C', 'ceo'],
      expectedEnding: '함께 성장한 공장',
    },
    {
      name: '노동자 균형 상생 경로 (2, B, A, D, A, B, C)',
      args: [2, 'B', 'A', 'D', 'A', 'B', 'C', 'worker'],
      expectedEnding: '함께 성장한 공장',
    },
    {
      name: '노동자 극단 효율 경로 (3, A, B, B, C, D, D)',
      args: [3, 'A', 'B', 'B', 'C', 'D', 'D', 'worker'],
      expectedEnding: '기업만 웃은 공장',
    },
  ];

  const results: SelfTestCaseResult[] = specs.map((spec) => {
    const res = simulateFullRun(...spec.args);
    const values = [
      ...Object.values(res.metrics),
      res.corporateScore,
      res.socialScore,
      res.combinedEfficiency,
      res.gap,
    ];
    const validNums = values.every((v) => Number.isFinite(v));
    const inBounds = Object.values(res.metrics).every((v) => v >= 0 && v <= 100);
    const endingMatch = res.ending.title === spec.expectedEnding;
    const passed = validNums && inBounds && endingMatch;

    return {
      name: spec.name,
      passed,
      corporateScore: Number(res.corporateScore.toFixed(2)),
      socialScore: Number(res.socialScore.toFixed(2)),
      combinedEfficiency: Number(res.combinedEfficiency.toFixed(2)),
      ending: res.ending.title,
      details: passed
        ? 'OK'
        : `corp=${res.corporateScore.toFixed(2)}, soc=${res.socialScore.toFixed(2)}, ending=${res.ending.title} (exp ${spec.expectedEnding})`,
    };
  });

  // 극단 입력 및 4지선다 옵션 개수 검증
  let structureOk = true;
  let structureDetails = '7턴 모두 4지선다 및 0~100 범위 확인';
  const ceoTurns = [
    CONFIG.turn1.options,
    CONFIG.turn2.options,
    CONFIG.turn3.options,
    CONFIG.turn4.options,
    CONFIG.turn5.options,
    CONFIG.turn6.options,
    CONFIG.turn7.options,
  ];
  const workerTurns = [
    CONFIG.workerScenario.turn1.options,
    CONFIG.workerScenario.turn2.options,
    CONFIG.workerScenario.turn3.options,
    CONFIG.workerScenario.turn4.options,
    CONFIG.workerScenario.turn5.options,
    CONFIG.workerScenario.turn6.options,
    CONFIG.workerScenario.turn7.options,
  ];

  for (const opts of [...ceoTurns, ...workerTurns]) {
    if (opts.length !== 4) {
      structureOk = false;
      structureDetails = `Expected 4 options, found ${opts.length}`;
      break;
    }
  }

  results.push({
    name: '7턴 × 4지선다 구조 검증 (기업가·노동자)',
    passed: structureOk,
    corporateScore: 0,
    socialScore: 0,
    combinedEfficiency: 0,
    ending: structureOk ? '정상' : '오류',
    details: structureDetails,
  });

  const allPassed = results.every((r) => r.passed);
  for (const r of results) {
    const tag = r.passed ? 'PASS' : 'FAIL';
    console.log(
      `[${tag}] ${r.name} -> 기업 ${r.corporateScore}, 사회 ${r.socialScore}, 종합효율 ${r.combinedEfficiency}, 엔딩 "${r.ending}" (${r.details})`
    );
  }
  console.log(`runSelfTest SUMMARY: ${allPassed ? 'ALL PASS' : 'FAILED'}`);

  return { allPassed, results };
}
