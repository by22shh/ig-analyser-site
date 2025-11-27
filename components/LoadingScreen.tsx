
import React from 'react';
import { Brain, Database, Eye, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoadingScreenProps {
  stage: 1 | 2 | 3;
  progress: number;
  progressMessage: string;
  mode?: 'standard' | 'debt' | 'hr' | 'influencer';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ stage, progress, progressMessage, mode = 'standard' }) => {
  const { t } = useLanguage();

  const isDebtMode = mode === 'debt';
  const isHrMode = mode === 'hr';
  const isInfluencerMode = mode === 'influencer';

  const getThemeColors = () => {
      if (isDebtMode) return {
          bg: 'bg-red-950/30',
          border: 'border-red-900/50',
          shadow: 'shadow-red-900/20',
          accent: 'text-red-500',
          accentBg: 'bg-red-950',
          progressStart: 'from-red-600',
          progressEnd: 'to-red-500'
      };
      if (isHrMode) return {
          bg: 'bg-emerald-950/30',
          border: 'border-emerald-900/50',
          shadow: 'shadow-emerald-900/20',
          accent: 'text-emerald-500',
          accentBg: 'bg-emerald-950',
          progressStart: 'from-emerald-600',
          progressEnd: 'to-emerald-500'
      };
      if (isInfluencerMode) return {
          bg: 'bg-fuchsia-950/30',
          border: 'border-fuchsia-900/50',
          shadow: 'shadow-fuchsia-900/20',
          accent: 'text-fuchsia-500',
          accentBg: 'bg-fuchsia-950',
          progressStart: 'from-fuchsia-600',
          progressEnd: 'to-fuchsia-500'
      };
      return {
          bg: 'bg-cyber-900/50',
          border: 'border-cyber-700',
          shadow: '',
          accent: 'text-cyber-accent',
          accentBg: 'bg-cyber-800',
          progressStart: 'from-cyber-accent',
          progressEnd: 'to-cyber-purple'
      };
  };

  const colors = getThemeColors();

  const getStepLabel = (stepId: number) => {
      if (isDebtMode) {
          if (stepId === 1) return t('stage_1_debt');
          if (stepId === 2) return t('stage_2_debt');
          if (stepId === 3) return t('stage_3_debt');
      }
      if (isHrMode) {
          if (stepId === 1) return t('stage_1_hr');
          if (stepId === 2) return t('stage_2_hr');
          if (stepId === 3) return t('stage_3_hr');
      }
      if (isInfluencerMode) {
          if (stepId === 1) return t('stage_1_influencer');
          if (stepId === 2) return t('stage_2_influencer');
          if (stepId === 3) return t('stage_3_influencer');
      }
      if (stepId === 1) return t('stage_1');
      if (stepId === 2) return t('stage_2');
      return t('stage_3');
  };

  const steps = [
    { id: 1, label: getStepLabel(1), icon: Database },
    { id: 2, label: getStepLabel(2), icon: Eye },
    { id: 3, label: getStepLabel(3), icon: Brain },
  ];

  return (
    <div className={`flex flex-col items-center justify-center min-h-[450px] w-full p-8 rounded-2xl border backdrop-blur-md relative overflow-hidden shadow-2xl animate-[fadeIn_0.5s_ease-out]
        ${colors.bg} ${colors.border} ${colors.shadow}
    `}>
      
      {/* Cyber Grid Background Effect in Box */}
      <div className={`absolute inset-0 bg-[size:40px_40px] pointer-events-none 
        ${isDebtMode 
            ? 'bg-[linear-gradient(rgba(220,38,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.03)_1px,transparent_1px)]' 
            : isHrMode
                ? 'bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)]'
                : 'bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)]'}
      `}></div>
      
      {/* Main Icon/Animation for Current Stage */}
      <div className="relative mb-10 z-10">
        <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse-slow ${isDebtMode ? 'bg-red-500/20' : isHrMode ? 'bg-emerald-500/20' : isInfluencerMode ? 'bg-fuchsia-500/20' : 'bg-cyber-accent/20'}`}></div>
        <div className={`relative p-6 rounded-full border ring-4 shadow-[0_0_30px_rgba(0,0,0,0.2)] transition-all duration-500
            ${isDebtMode 
                ? 'bg-red-950 border-red-500/30 ring-red-900 shadow-red-500/10' 
                : isHrMode
                    ? 'bg-emerald-950 border-emerald-500/30 ring-emerald-900 shadow-emerald-500/10'
                    : isInfluencerMode
                        ? 'bg-fuchsia-950 border-fuchsia-500/30 ring-fuchsia-900 shadow-fuchsia-500/10'
                        : 'bg-cyber-800 border-cyber-accent/30 ring-cyber-900 shadow-cyan-500/10'}
        `}>
            {stage === 1 && <Database className={`w-12 h-12 animate-pulse ${colors.accent}`} />}
            {stage === 2 && <Eye className={`w-12 h-12 animate-pulse ${colors.accent}`} />}
            {stage === 3 && <Brain className={`w-12 h-12 animate-pulse ${colors.accent}`} />}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between w-full max-w-xs mb-10 relative z-10">
        {/* Connecting Line */}
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 -z-10 
            ${isDebtMode ? 'bg-red-900/50' : isHrMode ? 'bg-emerald-900/50' : isInfluencerMode ? 'bg-fuchsia-900/50' : 'bg-cyber-700'}
        `}></div>
        
        {steps.map((s) => {
          const isActive = stage === s.id;
          const isCompleted = stage > s.id;
          
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 z-10">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                ${isDebtMode ? 'bg-red-950' : isHrMode ? 'bg-emerald-950' : isInfluencerMode ? 'bg-fuchsia-950' : 'bg-cyber-900'}
                ${isActive 
                    ? `${colors.accent} border-current scale-110 shadow-[0_0_10px_currentColor]`
                    : isCompleted 
                        ? isDebtMode ? 'border-red-700 text-red-700' : isHrMode ? 'border-emerald-700 text-emerald-700' : isInfluencerMode ? 'border-fuchsia-700 text-fuchsia-700' : 'border-green-500 text-green-500'
                        : isDebtMode ? 'border-red-900/50 text-red-900' : isHrMode ? 'border-emerald-900/50 text-emerald-900' : isInfluencerMode ? 'border-fuchsia-900/50 text-fuchsia-900' : 'border-cyber-700 text-slate-600'}
              `}>
                {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold font-mono">{s.id}</span>}
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider absolute -bottom-6 whitespace-nowrap transition-colors duration-300 
                ${isActive 
                    ? colors.accent 
                    : isCompleted 
                        ? isDebtMode ? 'text-red-700' : isHrMode ? 'text-emerald-700' : isInfluencerMode ? 'text-fuchsia-700' : 'text-green-500' 
                        : 'text-slate-600'}
              `}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm relative z-10 mt-2">
        <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
             <span className="uppercase">
                {stage === 1 ? (isDebtMode ? t('loading_connect') : isHrMode ? t('loading_connect') : isInfluencerMode ? t('loading_connect') : t('loading_connect').split('.')[0] + '...') : 
                 stage === 2 ? (isDebtMode ? t('loading_images_debt') : isHrMode ? t('loading_images_hr') : isInfluencerMode ? t('loading_images_influencer') : t('loading_images', { current: 0, total: 0 }).split(':')[0] + '...') : 
                 (isDebtMode ? t('loading_final_debt') : isHrMode ? t('loading_final_hr') : isInfluencerMode ? t('loading_final_influencer') : t('loading_final').split('.')[0] + '...')}
             </span>
             <span className={colors.accent}>{Math.round(progress)}%</span>
        </div>
        <div className={`h-1.5 w-full rounded-full overflow-hidden border ${isDebtMode ? 'bg-red-950 border-red-900/50' : isHrMode ? 'bg-emerald-950 border-emerald-900/50' : isInfluencerMode ? 'bg-fuchsia-950 border-fuchsia-900/50' : 'bg-cyber-800 border-cyber-700/50'}`}>
            <div 
                className={`h-full transition-all duration-300 ease-out relative bg-gradient-to-r ${colors.progressStart} ${colors.progressEnd}`}
                style={{ width: `${progress}%` }}
            >
            </div>
        </div>
      </div>

      <p className="mt-8 text-slate-300 font-mono text-xs text-center tracking-wide max-w-sm animate-pulse leading-relaxed min-h-[3em]">
        {progressMessage}
      </p>
    </div>
  );
};
