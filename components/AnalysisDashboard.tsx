
import React, { useState, useEffect } from 'react';
import { InstagramProfile, StrategicReport } from '../types';
import { ChatWidget } from './ChatWidget';
import { ProfileAvatar } from './ProfileAvatar';
import { ActivityHeatmap } from './ActivityHeatmap';
import { 
  Download,  
  Eye,
  Copy,
  Check,
  BarChart3,
  Activity,
  MessageCircle,
  Heart,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Terminal,
  MapPin,
  Music,
  Users,
  Pin
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

// --- MARKDOWN RENDERER ---

const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const renderedElements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];

    const processInlineStyles = (str: string) => {
        const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white print:text-black">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic text-slate-300 print:text-slate-700">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || (trimmed.startsWith('* ') && !trimmed.endsWith('*'))) {
            const content = trimmed.replace(/^[-•*]\s+/, '');
            currentList.push(
                <li key={`li-${index}`} className="ml-5 pl-1 text-slate-300 list-disc marker:text-cyber-accent/70 print:text-slate-800 print:marker:text-black">
                    {processInlineStyles(content)}
                </li>
            );
        } 
        else if (trimmed.startsWith('###')) {
            if (currentList.length > 0) {
                renderedElements.push(<ul key={`ul-${index}`} className="mb-3 space-y-1">{currentList}</ul>);
                currentList = [];
            }
            renderedElements.push(
                <h4 key={`h4-${index}`} className="font-display font-bold text-cyber-accent mt-4 mb-2 text-md print:text-black uppercase">
                    {trimmed.replace(/###\s*/, '')}
                </h4>
            );
        }
        else {
            if (currentList.length > 0) {
                renderedElements.push(<ul key={`ul-${index}`} className="mb-3 space-y-1">{currentList}</ul>);
                currentList = [];
            }
            
            if (trimmed.length === 0) {
                renderedElements.push(<div key={`br-${index}`} className="h-2" />);
            } else {
                renderedElements.push(
                    <p key={`p-${index}`} className="mb-2 leading-relaxed text-slate-300 print:text-slate-800">
                        {processInlineStyles(line)}
                    </p>
                );
            }
        }
    });

    if (currentList.length > 0) {
        renderedElements.push(<ul key={`ul-end`} className="mb-3 space-y-1">{currentList}</ul>);
    }

    return renderedElements;
};

const PrintStyles = () => (
  <style>{`
    @media print {
      @page { margin: 1.5cm; size: auto; }
      body {
        background-color: white !important;
        background-image: none !important;
        color: black !important;
      }
      nav, button, .fixed, .animate-pulse, .group-hover\\:opacity-100, .no-print {
        display: none !important;
      }
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
      }
      .bg-cyber-800\\/20, .bg-cyber-800\\/40 {
        background: white !important;
        border: 1px solid #ddd !important;
      }
      .text-slate-200, .text-slate-300, .text-slate-400, .text-white {
        color: #1f2937 !important; 
      }
      .text-cyber-accent {
        color: #0e7490 !important; 
      }
      .rounded-xl {
        border: 1px solid #e5e7eb !important;
        background: white !important;
        box-shadow: none !important;
        margin-bottom: 20px !important;
        break-inside: avoid !important;
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
  
  const er = profile.followersCount > 0 
    ? (((totalLikes + totalComments) / posts.length) / profile.followersCount * 100).toFixed(2) 
    : "0";

  const chartData = [...posts].reverse().map((post) => ({
    date: new Date(post.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    likes: post.likesCount,
    comments: post.commentsCount,
    er: profile.followersCount > 0 ? ((post.likesCount + post.commentsCount) / profile.followersCount * 100).toFixed(2) : 0
  }));

  // --- EXTRACTION OF RICH DATA ---
  const uniqueLocations = Array.from(new Set(posts.map(p => p.location?.name).filter(Boolean))) as string[];
  const uniqueMusic = Array.from(new Set(posts.map(p => p.musicInfo ? `${p.musicInfo.artist} - ${p.musicInfo.song}` : null).filter(Boolean))) as string[];
  const pinnedPostsCount = posts.filter(p => p.isPinned).length;
  
  const relatedProfiles = profile.relatedProfiles?.slice(0, 5) || [];

  let frequency = "Н/Д";
  if (posts.length > 1) {
    const firstDate = new Date(posts[posts.length - 1].timestamp).getTime();
    const lastDate = new Date(posts[0].timestamp).getTime();
    const daysDiff = (lastDate - firstDate) / (1000 * 3600 * 24);
    const avgDays = Math.round(daysDiff / (posts.length - 1));
    frequency = avgDays === 0 ? "Ежедневно" : `Раз в ${avgDays} дн.`;
  }

  const isWarningSection = (title: string) => title.includes("ОШИБКИ") || title.includes("БАРЬЕРЫ") || title.includes("ОТСУТСТВИЯ");
  const isActionSection = (title: string) => title.includes("ФРАЗЫ") || title.includes("ТРИГГЕРЫ") || title.includes("РЕКОМЕНДАЦИИ");
  const isInsightSection = (title: string) => title.includes("НЕОЧЕВИДНЫЕ") || title.includes("ПАТТЕРНЫ");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out] pb-20 relative">
      <PrintStyles />
      <ChatWidget profile={profile} report={analysis} />

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyber-700 pb-6 print:border-gray-300">
        <div className="flex items-center gap-4">
            <ProfileAvatar 
              src={profile.profilePicUrl} 
              alt={profile.username} 
              className="w-16 h-16 rounded-lg border border-cyber-500 shadow-[0_0_15px_rgba(34,211,238,0.2)] print:shadow-none print:border-gray-400 object-cover"
            />
            <div>
                <h1 className="text-2xl font-display font-bold text-white tracking-wide print:text-black">
                    ДОСЬЕ: @{profile.username.toUpperCase()}
                </h1>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 mt-1 print:text-gray-600">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {profile.followersCount.toLocaleString()} Followers</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 opacity-70" /> {profile.followsCount.toLocaleString()} Following</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {profile.postsCount.toLocaleString()} Posts</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2 no-print">
             <button 
                onClick={() => copyToClipboard(analysis.rawText, 'full')}
                className="p-2 bg-cyber-800 hover:bg-cyber-700 text-cyber-accent rounded border border-cyber-700 transition-colors flex items-center gap-2"
            >
               {copiedSection === 'full' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               <span className="text-xs font-bold hidden md:inline">COPY RAW</span>
            </button>
            <button 
                onClick={handlePrint}
                className="p-2 bg-cyber-800 hover:bg-cyber-700 text-cyber-accent rounded border border-cyber-700 transition-colors flex items-center gap-2"
            >
               <Download className="w-4 h-4" />
               <span className="text-xs font-bold hidden md:inline">SAVE PDF</span>
            </button>
             <button 
                onClick={onReset}
                className="p-2 bg-red-950/50 hover:bg-red-900/50 text-red-400 rounded border border-red-900/50 transition-colors flex items-center gap-2"
            >
               <RefreshCw className="w-4 h-4" />
               <span className="text-xs font-bold hidden md:inline">NEW SCAN</span>
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Avg. Likes" value={avgLikes.toLocaleString()} subValue={`Last ${posts.length} posts`} icon={Heart} />
        <StatCard label="Avg. Comments" value={avgComments.toLocaleString()} subValue="Interaction" icon={MessageCircle} />
        <StatCard label="Engagement Rate" value={`${er}%`} subValue={parseFloat(er) > 3 ? "High" : "Avg"} icon={Activity} />
        <StatCard label="Post Frequency" value={frequency} subValue="Consistency" icon={Calendar} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:break-inside-avoid">
          <div className="lg:col-span-2 bg-cyber-800/20 border border-cyber-700/50 rounded-xl p-4 backdrop-blur-sm">
               <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-cyber-accent" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Activity Matrix</h3>
               </div>
               <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(34,211,238,0.05)'}} />
                        <Bar dataKey="likes" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="comments" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
          </div>
           <div className="bg-cyber-800/20 border border-cyber-700/50 rounded-xl p-4 backdrop-blur-sm">
               <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-cyber-purple" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">ER Trend</h3>
               </div>
               <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" hide />
                        {/* Fix: Start Y axis from 0 to avoid "flying" lines, but let it grow automatically */}
                        <YAxis hide domain={[0, 'auto']} padding={{ top: 20, bottom: 5 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                            type="monotone" 
                            dataKey="er" 
                            stroke="#a855f7" 
                            strokeWidth={3} 
                            dot={{fill: '#a855f7', r: 4, strokeWidth: 0}} 
                            activeDot={{r: 6, fill: '#fff'}} 
                            isAnimationActive={true}
                        />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
          </div>
      </div>

      {/* Posting Heatmap */}
      <ActivityHeatmap posts={posts} />

      {/* Digital Footprint Section (New) */}
      {(uniqueLocations.length > 0 || uniqueMusic.length > 0 || relatedProfiles.length > 0 || pinnedPostsCount > 0) && (
          <div className="bg-cyber-900/30 border border-cyber-800 p-6 rounded-xl break-inside-avoid">
             <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-500" /> Digital Footprint & Context
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {uniqueLocations.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 uppercase tracking-widest">
                            <MapPin className="w-3 h-3" /> Recent Locations
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {uniqueLocations.slice(0, 5).map((loc, i) => (
                                <span key={i} className="bg-cyber-800/50 border border-cyber-700/50 text-slate-300 text-[10px] px-2 py-1 rounded">
                                    {loc}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {uniqueMusic.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 uppercase tracking-widest">
                            <Music className="w-3 h-3" /> Music Taste
                        </div>
                        <ul className="space-y-1">
                            {uniqueMusic.slice(0, 3).map((track, i) => (
                                <li key={i} className="text-[10px] text-slate-300 truncate max-w-[200px]">
                                    ♪ {track}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {relatedProfiles.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 uppercase tracking-widest">
                            <Users className="w-3 h-3" /> Related Circle
                        </div>
                        <div className="flex flex-wrap gap-2">
                             {relatedProfiles.map((rp, i) => (
                                <span key={i} className="text-[10px] text-slate-300 bg-cyber-800/30 px-2 py-0.5 rounded border border-white/5">
                                    @{rp.username}
                                </span>
                             ))}
                        </div>
                    </div>
                )}

                {pinnedPostsCount > 0 && (
                     <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 uppercase tracking-widest">
                            <Pin className="w-3 h-3" /> Strategy
                        </div>
                        <div className="text-sm text-white font-mono">
                            {pinnedPostsCount} Pinned Post(s) detected.
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                            High priority for analysis.
                        </div>
                    </div>
                )}
             </div>
          </div>
      )}

      {/* Report Content */}
      <div className="space-y-6">
         {analysis.sections.map((section, idx) => {
             const isWarn = isWarningSection(section.title.toUpperCase());
             const isAct = isActionSection(section.title.toUpperCase());
             const isInsight = isInsightSection(section.title.toUpperCase());

             return (
                 <div 
                    key={idx} 
                    className={`
                        rounded-xl p-6 border backdrop-blur-md transition-all duration-300 break-inside-avoid
                        ${isWarn 
                            ? 'bg-red-950/10 border-red-500/30 hover:border-red-500/50' 
                            : isAct 
                                ? 'bg-cyber-900/40 border-cyber-accent/30 hover:border-cyber-accent/50 shadow-[0_0_30px_rgba(34,211,238,0.05)]'
                                : isInsight
                                    ? 'bg-purple-900/10 border-purple-500/30 hover:border-purple-500/50'
                                    : 'bg-cyber-800/20 border-cyber-700/30 hover:border-cyber-600'}
                    `}
                 >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            {isWarn && <AlertTriangle className="w-5 h-5 text-red-500" />}
                            {isAct && <Terminal className="w-5 h-5 text-cyber-accent" />}
                            {isInsight && <Lightbulb className="w-5 h-5 text-purple-400" />}
                            
                            <h2 className={`
                                font-display font-bold text-lg tracking-wide uppercase
                                ${isWarn ? 'text-red-400' : isAct ? 'text-cyber-accent' : isInsight ? 'text-purple-300' : 'text-white'}
                                print:text-black
                            `}>
                                {section.title}
                            </h2>
                        </div>
                        <button 
                            onClick={() => copyToClipboard(section.content, `sec-${idx}`)}
                            className="text-slate-600 hover:text-cyber-accent transition-colors print:hidden"
                        >
                            {copiedSection === `sec-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none font-sans text-slate-300 print:text-black">
                        {renderMarkdown(section.content)}
                    </div>
                 </div>
             );
         })}
      </div>

      {analysis.visionAnalysis && analysis.visionAnalysis.length > 0 && (
        <div className="mt-12 border-t border-cyber-800 pt-8 no-print">
            <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-cyber-accent transition-colors list-none">
                    <Terminal className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-widest">System Logs: Visual Intelligence Data</span>
                </summary>
                <div className="mt-4 bg-black/50 rounded-lg p-4 font-mono text-[10px] text-slate-500 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto border border-cyber-900">
                    {analysis.visionAnalysis.join("\n\n-------------------\n\n")}
                </div>
            </details>
        </div>
      )}
    </div>
  );
};
