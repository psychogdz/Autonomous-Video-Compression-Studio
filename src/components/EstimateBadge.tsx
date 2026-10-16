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
      <div className="p-4 rounded-xl glass-panel border border-obsidian-700/60 animate-pulse text-xs text-slate-400">
        Calculating optimal compression estimate...
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="p-4 rounded-xl glass-panel-elevated border border-brand-blue/30 space-y-3 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-obsidian-700/50 pb-2.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-blue" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Decision Engine Pre-Flight Estimate
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded font-semibold bg-brand-blue/15 text-brand-blue border border-brand-blue/30">
          {estimate.resolvedCodec}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-obsidian-900/80 rounded-lg p-2.5 border border-obsidian-700/40">
          <span className="text-[11px] text-slate-400 block">Estimated Size</span>
          <p className="text-base font-bold text-white font-mono mt-0.5">
            ~{estimate.estimatedSizeMB} MB
          </p>
        </div>

        <div className="bg-obsidian-900/80 rounded-lg p-2.5 border border-obsidian-700/40">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <TrendingDown className="w-3 h-3 text-emerald-400" />
            <span>Space Reduction</span>
          </span>
          <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
            -{estimate.estimatedReductionPercent}%
          </p>
        </div>

        <div className="bg-obsidian-900/80 rounded-lg p-2.5 border border-obsidian-700/40 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Est. Processing Time</span>
          </span>
          <p className="text-base font-bold text-cyan-300 font-mono mt-0.5">
            ~{estimate.estimatedDurationSeconds}s
          </p>
        </div>
      </div>

      {/* Explanation */}
      {estimate.explanation && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {estimate.explanation}
        </p>
      )}

      {/* Active Warnings */}
      {estimate.warnings && estimate.warnings.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {estimate.warnings.map((warn, i) => (
            <div
              key={i}
              className="flex items-start space-x-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
