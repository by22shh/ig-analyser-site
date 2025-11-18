
import React from 'react';
import { Brain, Database, Eye, Check } from 'lucide-react';

interface LoadingScreenProps {
  stage: 1 | 2 | 3;
  progress: number;
  progressMessage: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ stage, progress, progressMessage }) => {
  const steps = [
    { id: 1, label: 'Сбор Данных', icon: Database },
    { id: 2, label: 'Обработка Медиа', icon: Eye },
    { id: 3, label: 'Глубокий Анализ', icon: Brain },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] w-full p-8 bg-cyber-900/50 rounded-2xl border border-cyber-700 backdrop-blur-md relative overflow-hidden shadow-2xl animate-[fadeIn_0.5s_ease-out]">
      
      {/* Cyber Grid Background Effect in Box */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {/* Main Icon/Animation for Current Stage */}
      <div className="relative mb-10 z-10">
        <div className="absolute inset-0 bg-cyber-accent/20 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="relative bg-cyber-800 p-6 rounded-full border border-cyber-accent/30 ring-4 ring-cyber-900 shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all duration-500">
            {stage === 1 && <Database className="w-12 h-12 text-cyber-accent animate-pulse" />}
            {stage === 2 && <Eye className="w-12 h-12 text-cyber-purple animate-pulse" />}
            {stage === 3 && <Brain className="w-12 h-12 text-pink-500 animate-pulse" />}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between w-full max-w-xs mb-10 relative z-10">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-cyber-700 -z-10"></div>
        
        {steps.map((s) => {
          const isActive = stage === s.id;
          const isCompleted = stage > s.id;
          
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 z-10">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-cyber-900
                ${isActive ? 'border-cyber-accent text-cyber-accent scale-110 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 
                  isCompleted ? 'border-green-500 text-green-500' : 'border-cyber-700 text-slate-600'}
              `}>
                {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold font-mono">{s.id}</span>}
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider absolute -bottom-6 whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-cyber-accent' : isCompleted ? 'text-green-500' : 'text-slate-600'}`}>
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
                {stage === 1 ? 'Соединение...' : 
                 stage === 2 ? 'Сканирование контента...' : 
                 'Генерация отчета...'}
             </span>
             <span className="text-cyber-accent">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-cyber-800 rounded-full overflow-hidden border border-cyber-700/50">
            <div 
                className="h-full bg-gradient-to-r from-cyber-accent to-cyber-purple transition-all duration-300 ease-out relative"
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
