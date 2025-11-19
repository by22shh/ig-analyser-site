
import React, { useState, useEffect } from 'react';
import { InstagramProfile, StrategicReport } from '../types';
import { ChatWidget } from './ChatWidget';
import { 
  Download, 
  Eye,
  Copy,
  Check,
  BarChart3,
  Activity,
  MessageCircle,
  Heart,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface AnalysisDashboardProps {
  profile: InstagramProfile;
  analysis: StrategicReport;
  onReset: () => void;
}

// Robust Avatar Component
const ProfileAvatar = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => { setImgSrc(src); setRetryCount(0); }, [src]);

    const handleError = () => {
        if (retryCount === 0) {
            setRetryCount(1);
            setImgSrc(`https://wsrv.nl/?url=${encodeURIComponent(src)}&w=200&h=200&output=jpg`);
        } else if (retryCount === 1) {
            setRetryCount(2);
            setImgSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=0f172a&color=22d3ee&size=200&bold=true&font-size=0.5`);
        }
    };

    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            className={className}
            onError={handleError}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
        />
    );
};

// --- VISUAL COMPONENTS ---

const StatCard = ({ label, value, subValue, icon: Icon }: any) => (
  <div className="bg-cyber-800/40 border border-cyber-700/50 p-4 rounded-xl backdrop-blur-sm relative overflow-hidden group hover:border-cyber-accent/50 transition-colors print:border-gray-300 print:bg-white print:break-inside-avoid">
    <div className="absolute right-2 top-2 text-cyber-700 group-hover:text-cyber-accent/20 transition-colors print:hidden">
      <Icon className="w-8 h-8 opacity-20" />
    </div>
    <div className="text-cyber-accent/60 text-[10px] font-mono uppercase tracking-widest mb-1 print:text-slate-600">{label}</div>
    <div className="text-2xl font-display font-bold text-white tracking-wide print:text-black">{value}</div>
    {subValue && <div className="text-xs text-slate-400 font-mono mt-1 print:text-slate-600">{subValue}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-cyber-900/90 border border-cyber-accent/30 p-3 rounded shadow-xl backdrop-blur-md">
        <p className="text-white font-mono text-xs mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs font-mono">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- PRINT STYLES ---
const PrintStyles = () => (
  <style>{`
    @media print {
      @page { margin: 1.5cm; size: auto; }
      
      body {
        background-color: white !important;
        background-image: none !important;
        color: black !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Hide UI elements */
      nav, button, .fixed, .animate-pulse, .group-hover\\:opacity-100, .no-print {
        display: none !important;
      }

      /* Reset Container Layouts */
      #root, main, .min-h-screen, .relative {
        position: static !important;
        overflow: visible !important;
        height: auto !important;
        min-height: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
        perspective: none !important;
      }

      /* Ensure Chart Container is visible but clean */
      .bg-cyber-800\\/20 {
        background: white !important;
        border: 1px solid #ddd !important;
      }

      /* Typography */
      .text-slate-200, .text-slate-300, .text-slate-400, .text-white {
        color: #1f2937 !important; /* Slate-800 */
      }
      .text-cyber-accent {
        color: #0e7490 !important; /* Cyan-700 - darker for print visibility */
      }
      .text-cyber-purple {
        color: #7e22ce !important; /* Purple-700 */
      }
      .text-red-400, .text-red-950 {
         color: #b91c1c !important;
         background: none !important;
         border-color: #fca5a5 !important;
      }

      /* Analysis Sections */
      .rounded-xl {
        border: 1px solid #e5e7eb !important;
        background: white !important;
        box-shadow: none !important;
        margin-bottom: 20px !important;
        break-inside: avoid !important;
      }

      /* Gradients removal */
      .bg-gradient-to-r, .bg-gradient-to-bl {
        background: none !important;
      }

      /* Charts overrides */
      .recharts-cartesian-grid line {
        stroke: #e5e7eb !important;
      }
      .recharts-text {
        fill: #374151 !important;
      }
      .recharts-default-tooltip {
        display: none !important;
      }
    }
  `}</style>
);

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ profile, analysis, onReset }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // --- DATA PROCESSING FOR VISUALS ---
  const posts = profile.posts || [];
  const totalLikes = posts.reduce((acc, p) => acc + p.likesCount, 0);
  const totalComments = posts.reduce((acc, p) => acc + p.commentsCount, 0);
  const avgLikes = posts.length ? Math.round(totalLikes / posts.length) : 0;
  const avgComments = posts.length ? Math.round(totalComments / posts.length) : 0;
  
  // Engagement Rate (approximate based on followers)
  const er = profile.followersCount > 0 
    ? (((totalLikes + totalComments) / posts.length) / profile.followersCount * 100).toFixed(2) 
    : "0";

  // Chart Data (Reverse to show oldest -> newest left to right)
  const chartData = [...posts].reverse().map((post) => ({
    date: new Date(post.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    likes: post.likesCount,
    comments: post.commentsCount,
    er: profile.followersCount > 0 ? ((post.likesCount + post.commentsCount) / profile.followersCount * 100).toFixed(2) : 0
  }));

  // Frequency Calculation
  let frequency = "Н/Д";
  if (posts.length > 1) {
    const firstDate = new Date(posts[posts.length - 1].timestamp).getTime();
    const lastDate = new Date(posts[0].timestamp).getTime();
    const daysDiff = (lastDate - firstDate) / (1000 * 3600 * 24);
    const avgDays = Math.round(daysDiff / (posts.length - 1));
    frequency = avgDays === 0 ? "Ежедневно" : `Раз в ${avgDays} дн.`;
  }

  // Identifying special sections for highlighting
  const isWarningSection = (title: string) => title.includes("ОШИБКИ") || title.includes("БАРЬЕРЫ") || title.includes("ОТСУТСТВИЯ");
  const isActionSection = (title: string) => title.includes("ФРАЗЫ") || title.includes("ТРИГГЕРЫ") || title.includes("РЕКОМЕНДАЦИИ");
  const isInsightSection = (title: string) => title.includes("НЕОЧЕВИДНЫЕ") || title.includes("ПАТТЕРНЫ");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out] pb-20 relative">
      <PrintStyles />
      
      {/* Chat Widget Integration */}
      <ChatWidget profile={profile} report={analysis} />

      {/* Top Bar: Dossier Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyber-700 pb-6 print:border-gray-300">
        <div className="flex items-center gap-4">
            <ProfileAvatar 
              src={profile.profilePicUrl} 
              alt={profile.username} 
              className="w-16 h-16 rounded-lg border border-cyber-500 shadow-[0_0_15px_rgba(34,211,238,0.2)] print:shadow-none print:border-gray-400"
            />
            <div>
                <h1 className="text-2xl font-display font-bold text-white tracking-wide print:text-black">
                    ДОСЬЕ: @{profile.username.toUpperCase()}
                </h1>
                <div className="flex gap-4 text-xs font-mono text-slate-400 mt-1 print:text-gray-600">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {profile.followersCount.toLocaleString()} FOLLOWERS</span>
                    <span>ID: {profile.username}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2 no-print">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-cyber-800 hover:bg-cyber-700 text-cyber-accent border border-cyber-700 rounded text-xs font-mono transition">
                <Download className="w-4 h-4" /> EXPORT PDF
            </button>
            <button onClick={onReset} className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded text-xs font-mono transition">
                НОВЫЙ ПОИСК
            </button>
        </div>
      </div>

      {/* --- VISUAL INTELLIGENCE BLOCK --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Вовлеченность (ER)" 
          value={`${er}%`} 
          subValue="Средний показатель"
          icon={Activity} 
        />
        <StatCard 
          label="Средние Лайки" 
          value={avgLikes.toLocaleString()} 
          subValue={`Всего: ${totalLikes.toLocaleString()}`}
          icon={Heart} 
        />
        <StatCard 
          label="Средние Комментарии" 
          value={avgComments.toLocaleString()} 
          subValue={`Всего: ${totalComments.toLocaleString()}`}
          icon={MessageCircle} 
        />
         <StatCard 
          label="Частота публикаций" 
          value={frequency} 
          subValue="На основе последних 10"
          icon={Calendar} 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:space-y-6">
        
        {/* Volume Chart */}
        <div className="bg-cyber-800/20 border border-cyber-700/50 p-6 rounded-xl backdrop-blur-sm print:break-inside-avoid">
            <h3 className="text-sm font-display font-bold text-slate-300 mb-6 flex items-center gap-2 print:text-black">
                <BarChart3 className="w-4 h-4 text-cyber-accent print:text-black" />
                ДИНАМИКА РЕАКЦИЙ (ПОСЛЕДНИЕ 10)
            </h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#334155', opacity: 0.2}} />
                        <Bar dataKey="likes" name="Лайки" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="comments" name="Комментарии" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Engagement Trend */}
        <div className="bg-cyber-800/20 border border-cyber-700/50 p-6 rounded-xl backdrop-blur-sm print:break-inside-avoid">
            <h3 className="text-sm font-display font-bold text-slate-300 mb-6 flex items-center gap-2 print:text-black">
                <Activity className="w-4 h-4 text-cyber-purple print:text-black" />
                ТРЕНД ВОВЛЕЧЕННОСТИ (%)
            </h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="er" name="ER %" stroke="#a855f7" strokeWidth={3} dot={{fill: '#a855f7', r: 4}} activeDot={{r: 6, stroke: '#fff'}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-cyber-700 to-transparent w-full my-8 opacity-50 print:hidden"></div>

      {/* --- TEXT REPORT CONTENT --- */}
      <div className="grid grid-cols-1 gap-6">
        {analysis.sections.map((section, idx) => (
            <div 
                key={idx} 
                className={`
                    group relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 print:break-inside-avoid
                    ${isWarningSection(section.title) 
                        ? 'bg-red-950/10 border-red-900/30 hover:border-red-500/50' 
                        : isActionSection(section.title)
                            ? 'bg-cyber-900/40 border-cyber-accent/30 hover:border-cyber-accent shadow-[0_0_20px_rgba(34,211,238,0.05)]'
                            : 'bg-cyber-800/20 border-cyber-700/50 hover:border-slate-500'
                    }
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`
                        font-display font-bold text-lg uppercase tracking-wider
                        ${isWarningSection(section.title) ? 'text-red-400' : isActionSection(section.title) ? 'text-cyber-accent' : 'text-white'}
                    `}>
                        {section.title}
                    </h3>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                        <button 
                            onClick={() => copyToClipboard(section.content, idx.toString())}
                            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                            title="Copy text"
                        >
                            {copiedSection === idx.toString() ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-invert prose-sm max-w-none font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {section.content}
                </div>

                {/* Decorators */}
                {isInsightSection(section.title) && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-500/10 to-transparent pointer-events-none rounded-tr-xl print:hidden"></div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};
