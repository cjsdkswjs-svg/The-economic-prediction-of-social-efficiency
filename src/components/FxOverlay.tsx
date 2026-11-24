import { motion, AnimatePresence } from 'motion/react';
import type { EffectSeverity } from '../utils/fx';

export interface FxTrigger {
  id: number;
  severity: EffectSeverity;
}

interface FxOverlayProps {
  trigger: FxTrigger | null;
}

const SPARKLE_POSITIONS = [
  { x: -180, y: -70, delay: 0 },
  { x: -110, y: -110, delay: 0.04 },
  { x: -35, y: -130, delay: 0.08 },
  { x: 45, y: -125, delay: 0.03 },
  { x: 120, y: -105, delay: 0.07 },
  { x: 185, y: -65, delay: 0.05 },
  { x: -140, y: 20, delay: 0.09 },
  { x: 145, y: 25, delay: 0.06 },
];

export function FxOverlay({ trigger }: FxOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      <AnimatePresence>
        {trigger && trigger.severity === 'warning' && (
          <motion.div
            key={`warn-${trigger.id}`}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0 border-[10px] border-rose-500/60 bg-rose-950/15"
          />
        )}

        {trigger && trigger.severity === 'mixed' && (
          <motion.div
            key={`mix-${trigger.id}`}
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 border-[8px] border-amber-400/50 bg-amber-900/10"
          />
        )}

        {trigger && trigger.severity === 'positive' && (
          <motion.div
            key={`pos-${trigger.id}`}
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0 border-[8px] border-emerald-400/55 bg-emerald-500/10"
          />
        )}

        {trigger && trigger.severity === 'positive' && (
          <div
            key={`burst-${trigger.id}`}
            className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
          >
            {SPARKLE_POSITIONS.map((p, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 1.35, x: p.x, y: p.y }}
                transition={{ duration: 0.65, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
                className="absolute h-3.5 w-3.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.9)]"
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
