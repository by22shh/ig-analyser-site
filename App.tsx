import React, { useState, useEffect } from 'react';
import { Instagram, Search, Eye, RefreshCw, AlertTriangle, History } from 'lucide-react';
import { fetchInstagramData } from './services/apifyService';
import { analyzeProfileWithGemini } from './services/geminiService';
import { InstagramProfile, StrategicReport } from './types';
import { LoadingScreen } from './components/LoadingScreen';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { getSearchHistory, addToSearchHistory, HistoryItem } from './utils/storage';

// Environment Variables
// Using process.env because we polyfilled/defined it in vite.config.ts
const APIFY_TOKEN = process.env.VITE_APIFY_TOKEN || "";

// --- VISUAL EFFECTS ---

const CyberBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-[#020617]"> 
    {/* Base: Rich Dark Blue/Slate */}
    <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/30 rounded-full blur-[120px] animate-pulse-slow mix-blend-screen pointer-events-none"></div>
    <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen pointer-events-none"></div>
    <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
    <div className="absolute bottom-[-10%] left-[-50%] right-[-50%] h-[100%] 
        bg-[linear-gradient(to_right,rgba(6,182,212,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.15)_1px,transparent_1px)] 
        bg-[size:60px_60px] 
        [transform:perspective(1000px)_rotateX(60deg)] 
        origin-bottom
        animate-[grid-flow_10s_linear_infinite]
        pointer-events-none 
        z-0">
    </div>
    <div className="absolute inset-0 flex justify-evenly opacity-50 pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
            <div key={i} className="w-px h-full bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent relative overflow-hidden">
                 <div 
                    className="absolute top-0 left-0 w-full h-64 bg-cyan-300 blur-[1px]"
                    style={{ 
                        animation: `scan ${3 + (i % 4)}s linear infinite`,
                        animationDelay: `-${i * 0.5}s`,
                        opacity: 0.7
                    }}
                 ></div>
            </div>
        ))}
    </div>
    <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay" 
         style={{ 
            backgroundImage: 'radial-gradient(circle at center, transparent 0%, #020617 100%)',
            backgroundSize: '100% 100%' 
         }}>
    </div>
    <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
  </div>
);

const AiCoreVisual = () => (
  <div className="relative w-56 h-56 mx-auto mb-12 group pointer-events-none select-none">
    <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-[50px] animate-pulse-slow"></div>
    <div className="absolute inset-0 border border-cyan-400/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
    <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
    <div className="absolute inset-4 border border-indigo-500/30 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
    <div className="absolute inset-4 border-r-2 border-indigo-400 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
    <div className="absolute inset-8 border border-cyan-300/20 rounded-full animate-[spin_4s_linear_infinite]"></div>
    <div className="absolute inset-8 border-b-2 border-cyan-300 rounded-full animate-[spin_4s_linear_infinite]"></div>
    <div className="absolute inset-[3.5rem] bg-[#0f172a]/90 backdrop-blur-md rounded-full border-2 border-cyan-500 flex items-center justify-center z-10 shadow-[0_0_40px_rgba(34,211,238,0.4)]">
        <div className="relative">
            <Eye className="w-12 h-12 text-cyan-400 animate-pulse" />
            <div className="absolute inset-0 bg-cyan-400/40 blur-lg animate-pulse"></div>
        </div>
    </div>
  </div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  // Loading state is now granular: 1 = Apify, 2 = Images, 3 = Final
  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input');
  const [loadingStage, setLoadingStage] = useState<1 | 2 | 3>(1);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState<InstagramProfile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<StrategicReport | null>(null);
  
  // Load history on mount
  const [recentSearches, setRecentSearches] = useState<HistoryItem[]>([]);
  
  useEffect(() => {
      setRecentSearches(getSearchHistory());
  }, [step]); // Refresh when step changes (e.g. after successful analysis)

  // Simulated progress for Stage 3
  useEffect(() => {
    let interval: any;
    if (step === 'loading' && loadingStage === 3) {
        setLoadingProgress(prev => (prev === 100 ? 0 : prev));
        interval = setInterval(() => {
            setLoadingProgress(prev => {
                const increment = Math.max(0.5, (98 - prev) / 50); 
                return prev >= 98 ? 98 : prev + increment;
            });
        }, 200);
    }
    return () => clearInterval(interval);
  }, [step, loadingStage]);

  // Orchestrates the analysis process.
  // Can start from scratch (fetch + analyze) or from existing data (analyze only).
  const startAnalysisFlow = async (inputUsername?: string, existingData?: InstagramProfile) => {
      setError(null);
      setStep('loading');
      
      let currentData = existingData;

      // PHASE 1: Fetch Data (if needed)
      if (!currentData && inputUsername) {
          setLoadingStage(1);
          setLoadingProgress(10);
          setLoadingMessage("Инициализация соединения... Поиск профиля...");

          let cleanUsername = inputUsername.trim();
          if (cleanUsername.includes('instagram.com/')) {
              const parts = cleanUsername.split('instagram.com/');
              if (parts[1]) cleanUsername = parts[1].split('/')[0].split('?')[0];
          }
          cleanUsername = cleanUsername.replace('@', '').replace(/\s/g, '');

          try {
              if (!APIFY_TOKEN) throw new Error("Ошибка: Не найден VITE_APIFY_TOKEN.");
              currentData = await fetchInstagramData(cleanUsername, APIFY_TOKEN);
              setProfileData(currentData);
              setLoadingProgress(100);
              await new Promise(r => setTimeout(r, 400));
          } catch (err: any) {
              console.error(err);
              setError(err.message || "Ошибка сбора данных.");
              setStep('input');
              return;
          }
      }

      if (!currentData) {
          setError("Системная ошибка: Данные профиля отсутствуют.");
          setStep('input');
          return;
      }

      // PHASE 2 & 3: AI Analysis
      setLoadingStage(2);
      setLoadingProgress(0);
      setLoadingMessage("Загрузка медиа-контента для анализа...");

      try {
          const analysis = await analyzeProfileWithGemini(currentData, (current, total, stage) => {
            if (stage === 'images') {
                const percentage = Math.round((current / total) * 100);
                setLoadingProgress(percentage);
                setLoadingMessage(`Параллельный анализ: обработано ${current} из ${total} изображений`);
            } else if (stage === 'final') {
                setLoadingStage(3);
                setLoadingProgress(0);
                setLoadingMessage(`Синтез данных и формирование досье...`);
            }
          });
          
          setAnalysisResult(analysis);
          
          // SAVE TO HISTORY
          addToSearchHistory(currentData.username, currentData, analysis);
          
          setStep('result');
      } catch (err: any) {
          console.error(err);
          setError(err.message || "Ошибка анализа данных.");
          // Keep profile data in state so user can retry just the analysis part
          setStep('input');
      }
  };

  const handleAnalyzeClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    // Clear previous data to start fresh
    setProfileData(null);
    setAnalysisResult(null);
    startAnalysisFlow(username);
  };

  const handleRetryAnalysis = () => {
      if (profileData) {
          startAnalysisFlow(undefined, profileData);
      }
  };
  
  const loadFromHistory = (item: HistoryItem) => {
      if (item.profileData && item.reportData) {
           setProfileData(item.profileData);
           setAnalysisResult(item.reportData);
           setStep('result');
      } else {
           // Re-run analysis if we only saved the username
           setUsername(item.username);
           startAnalysisFlow(item.username);
      }
  };

  return (
    <div className="min-h-screen w-full text-slate-200 relative overflow-x-hidden selection:bg-cyan-400 selection:text-black font-sans bg-black/0">
      <CyberBackground />

      <nav className="w-full border-b border-white/10 bg-[#0f172a]/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-500 text-slate-900 rounded flex items-center justify-center font-bold shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                    <Eye className="w-5 h-5" />
                </div>
                <span className="font-display font-bold text-lg tracking-widest text-white">ZRETI</span>
            </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 relative z-10">
        
        {step === 'input' && (
            <div className="w-full max-w-2xl animate-[fadeIn_0.8s_ease-out] relative">
                <AiCoreVisual />

                <div className="text-center mb-12 relative z-20">
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 uppercase tracking-tight drop-shadow-[0_0_30px_rgba(34,211,238,0.5)] flex flex-col items-center leading-tight">
                        <span>ПОДРОБНЫЙ</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 animate-pulse my-2">ИИ-АНАЛИЗ</span>
                        <span className="text-3xl md:text-5xl tracking-widest font-sans font-extrabold mt-1">INSTAGRAM-ПРОФИЛЯ</span>
                    </h1>
                    <p className="text-slate-300 max-w-lg mx-auto font-mono text-sm bg-black/40 backdrop-blur px-4 py-2 rounded border border-white/10">
                        Система сканирует визуальные паттерны, скрытые метаданные и психологические маркеры для построения полного цифрового профиля личности.
                    </p>
                </div>

                <div className="bg-[#0f172a]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all hover:border-cyan-500/50 hover:shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[shimmer_2s_infinite]"></div>
                    
                    <form onSubmit={handleAnalyzeClick} className="space-y-6 relative z-20">
                        <div>
                            <label className="flex justify-between text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 font-mono">
                                <span>Target Identifier</span>
                                <span className="text-slate-500">REQUIRED</span>
                            </label>
                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-cyan-500/20 rounded-lg blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-cyan-400 transition duration-300" />
                                <input 
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="@username"
                                    className="relative w-full bg-[#020617] border border-slate-700 rounded-lg py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono shadow-inner"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex flex-col gap-2 animate-[fadeIn_0.3s_ease-out]">
                                <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-lg text-red-200 text-xs font-mono flex items-center gap-3 shadow-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                    <span>[ERROR]: {error}</span>
                                </div>
                                
                                {/* Retry Action Logic */}
                                {profileData && (
                                    <button
                                        type="button"
                                        onClick={handleRetryAnalysis}
                                        className="w-full bg-cyber-800 hover:bg-cyber-700 border border-cyber-accent/30 text-cyber-accent py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-mono text-xs uppercase tracking-wider"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Повторить анализ (данные уже загружены)
                                    </button>
                                )}
                            </div>
                        )}

                        {!profileData && (
                            <button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-5 rounded-lg transition transform active:scale-[0.99] flex items-center justify-center gap-3 uppercase tracking-wider font-display shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] border border-cyan-400/20"
                            >
                                <span className="flex items-center gap-2 text-lg">
                                    Запустить Анализ <Search className="w-5 h-5" />
                                </span>
                            </button>
                        )}
                    </form>
                    
                    {/* RECENT SEARCHES */}
                    {recentSearches.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-white/10 relative z-20">
                             <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-4 uppercase tracking-widest">
                                <History className="w-3 h-3" /> Недавние проверки
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {recentSearches.map((item) => (
                                    <button
                                        key={item.username}
                                        onClick={() => loadFromHistory(item)}
                                        className="group flex items-center gap-3 bg-slate-800/50 hover:bg-cyber-900/80 border border-slate-700 hover:border-cyber-accent/50 rounded-lg p-2 pr-4 transition-all"
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-700 overflow-hidden">
                                            {item.profileData?.profilePicUrl ? (
                                                <img src={item.profileData.profilePicUrl} alt={item.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                    <Instagram className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-slate-200 group-hover:text-cyber-accent">@{item.username}</div>
                                            <div className="text-[10px] text-slate-500">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {step === 'loading' && (
            <div className="w-full max-w-xl animate-[fadeIn_0.5s_ease-out]">
                <LoadingScreen 
                    stage={loadingStage}
                    progress={loadingProgress}
                    progressMessage={loadingMessage}
                />
            </div>
        )}

        {step === 'result' && profileData && analysisResult && (
            <AnalysisDashboard 
                profile={profileData} 
                analysis={analysisResult} 
                onReset={() => {
                    setStep('input');
                    setProfileData(null);
                    setAnalysisResult(null);
                    setUsername('');
                    setLoadingMessage("");
                    setLoadingStage(1);
                    setLoadingProgress(0);
                }}
            />
        )}

      </main>
    </div>
  );
};

export default App;