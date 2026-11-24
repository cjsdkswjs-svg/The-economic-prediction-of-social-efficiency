import { motion } from 'motion/react';
import { CONFIG, type MetricDeltas, type Metrics } from '../simulation/engine';

interface MetricsBarProps {
  metrics: Metrics;
  lastDeltas: MetricDeltas | null;
}

function formatMetricValue(val: number): number {
  return Math.round(val);
}

function formatDeltaText(delta: number): string {
  const abs = Math.abs(delta);
  const formatted = Number.isInteger(abs) ? String(abs) : abs.toFixed(1).replace(/\.0$/, '');
  return delta > 0 ? `▲ ${formatted}` : `▼ ${formatted}`;
}

export function MetricsBar({ metrics, lastDeltas }: MetricsBarProps) {
  const corporateItems = CONFIG.metricMeta.filter((m) => m.group === 'corporate');
  const socialItems = CONFIG.metricMeta.filter((m) => m.group === 'social');

  const renderMetricTile = (item: (typeof CONFIG.metricMeta)[number]) => {
    const value = metrics[item.key];
    const rounded = formatMetricValue(value);
    const delta = lastDeltas?.[item.key] ?? 0;
    const hasDelta = Math.abs(delta) >= 0.05;
    const isCorp = item.group === 'corporate';

    return (
      <motion.div
        key={`${item.key}-${hasDelta ? Math.round(value * 10) : 'idle'}`}
        initial={hasDelta ? { scale: 1.05 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        data-testid={`metric-${item.key}`}
        className={`flex min-w-0 flex-col justify-between rounded-xl border px-3 py-2.5 ${
          hasDelta
            ? delta > 0
              ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-300/60'
              : 'border-rose-300 bg-rose-50/75 ring-2 ring-rose-300/60'
            : isCorp
            ? 'border-blue-200 bg-blue-50/85'
            : 'border-emerald-200 bg-emerald-50/85'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[14px] font-bold text-slate-800">
            {item.label}
          </span>
          <span className="text-[12px] font-semibold text-slate-500 shrink-0">
            {item.code}
          </span>
        </div>

        <div className="mt-1 flex items-baseline justify-between gap-1.5">
          <span
            className={`font-num text-[22px] font-bold leading-none ${
              isCorp ? 'text-blue-900' : 'text-emerald-900'
            }`}
          >
            {rounded}
          </span>
          {hasDelta && (
            <span
              className={`font-num text-[14px] font-bold leading-none whitespace-nowrap ${
                delta > 0 ? 'text-blue-700' : 'text-rose-700'
              }`}
            >
              {formatDeltaText(delta)}
            </span>
          )}
        </div>

        <div
          className={`mt-2 h-2 w-full overflow-hidden rounded-full ${
            isCorp ? 'bg-blue-100' : 'bg-emerald-100'
          }`}
          role="progressbar"
          aria-label={item.label}
          aria-valuenow={rounded}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCorp ? 'bg-blue-600' : 'bg-emerald-600'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <section
      aria-label="공장 및 사회 지표 현황"
      className="w-full rounded-2xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-3.5 shadow-md"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
        <div className="lg:col-span-2">
          <div className="mb-1.5 flex items-center justify-between px-0.5">
            <span className="text-[14px] font-bold tracking-tight text-blue-800">
              기업 지표
            </span>
            <span className="text-[12px] font-medium text-slate-500">생산성·이윤</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {corporateItems.map(renderMetricTile)}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="mb-1.5 flex items-center justify-between px-0.5">
            <span className="text-[14px] font-bold tracking-tight text-emerald-800">
              사회 지표
            </span>
            <span className="text-[12px] font-medium text-slate-500">고용 · 소득·소비 · 개인정보 · AI 안전 · 전문성</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {socialItems.map(renderMetricTile)}
          </div>
        </div>
      </div>
    </section>
  );
}
