import React from 'react';
import { Sparkles, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { DecisionEstimate } from '../../shared/types';

interface EstimateBadgeProps {
  estimate: DecisionEstimate | null;
  isLoading?: boolean;
}

export const EstimateBadge: React.FC<EstimateBadgeProps> = ({ estimate, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-void-900/60 border border-white/[0.08] animate-pulse text-xs text-slate-400 font-mono">
        Calibrating optimal compression profile...
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-void-900/95 to-void-850/95 border border-prism-cyan/30 shadow-[0_0_25px_-5px_rgba(0,210,255,0.15)] space-y-3.5 relative overflow-hidden">
      {/* Top light shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-prism-cyan/50 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-prism-cyan" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Pre-Flight Mathematical Estimate
          </span>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded font-semibold bg-prism-cyan/15 text-prism-cyan border border-prism-cyan/30">
          {estimate.resolvedCodec}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-void-950/80 rounded-xl p-3 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 block font-medium">Estimated Output</span>
          <p className="text-base font-bold text-white font-mono mt-0.5">
            ~{estimate.estimatedSizeMB} MB
          </p>
        </div>

        <div className="bg-void-950/80 rounded-xl p-3 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1 font-medium">
            <TrendingDown className="w-3.5 h-3.5 text-prism-mint" />
            <span>Space Reduction</span>
          </span>
          <p className="text-base font-bold text-prism-mint font-mono mt-0.5">
            -{estimate.estimatedReductionPercent}%
          </p>
        </div>

        <div className="bg-void-950/80 rounded-xl p-3 border border-white/[0.05] col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-prism-cyan" />
            <span>Estimated Duration</span>
          </span>
          <p className="text-base font-bold text-prism-cyan font-mono mt-0.5">
            ~{estimate.estimatedDurationSeconds}s
          </p>
        </div>
      </div>

      {/* Explanation */}
      {estimate.explanation && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans pt-0.5">
          {estimate.explanation}
        </p>
      )}

      {/* Active Warnings */}
      {estimate.warnings && estimate.warnings.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {estimate.warnings.map((warn, i) => (
            <div
              key={i}
              className="flex items-start space-x-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/25 px-3 py-2 rounded-xl"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-prism-amber" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
