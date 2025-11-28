
import React, { useState, useEffect } from 'react';
import { InstagramProfile, StrategicReport } from '../types';
import { ChatWidget } from './ChatWidget';
import { ProfileAvatar } from './ProfileAvatar';
import { DigitalCircle } from './DigitalCircle';
import { useLanguage } from '../contexts/LanguageContext';
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

const StatCard = ({ label, value, subValue, icon: Icon, tooltip }: any) => (
  <div className="bg-cyber-800/40 border border-cyber-700/50 p-4 rounded-xl backdrop-blur-sm group hover:border-cyber-accent/50 transition-colors print:border-gray-300 print:bg-white print:break-inside-avoid relative">
    <div className="absolute right-2 top-2 text-cyber-700 group-hover:text-cyber-accent/20 transition-colors print:hidden pointer-events-none">
      <Icon className="w-8 h-8 opacity-20" />
    </div>
    
    {/* Label with Tooltip (Hover over label to see) */}
    <div className="relative group/tooltip inline-block z-20">
        <div className={`text-cyber-accent/60 text-[10px] font-mono uppercase tracking-widest mb-1 print:text-slate-600 ${tooltip ? 'cursor-help border-b border-cyber-accent/20 border-dashed' : ''}`}>
            {label}
        </div>
        {tooltip && (
            <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-[#020617] border border-cyber-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 leading-relaxed shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                {tooltip}
                {/* Arrow */}
                <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-cyber-700"></div>
            </div>
        )}
    </div>
    
    <div className="text-2xl font-display font-bold text-white tracking-wide print:text-black relative z-10">{value}</div>
    {subValue && <div className="text-xs text-slate-400 font-mono mt-1 print:text-slate-600 relative z-10">{subValue}</div>}
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
        // Pass 1: Bold (**...**)
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.length >= 4 && part.endsWith('**')) {
                return <strong key={`bold-${i}`} className="font-bold text-white print:text-black">{part.slice(2, -2)}</strong>;
            }
            
            // Pass 2: Italic (*...*)
            const subParts = part.split(/(\*.*?\*)/g);
            return subParts.map((subPart, j) => {
                if (subPart.startsWith('*') && subPart.length >= 2 && subPart.endsWith('*')) {
                    if (subPart === '**') return subPart; // Ignore empty bold treated as italic
                    return <em key={`italic-${i}-${j}`} className="italic text-slate-300 print:text-slate-700">{subPart.slice(1, -1)}</em>;
                }
                return subPart;
            });
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
        else if (/^\d+\./.test(trimmed)) {
            if (currentList.length > 0) {
                renderedElements.push(<ul key={`ul-${index}`} className="mb-3 space-y-1">{currentList}</ul>);
                currentList = [];
            }
            
            let content = trimmed;
            // Fix unclosed bold
            if ((content.match(/\*\*/g) || []).length % 2 !== 0) {
                content += "**";
            }
            
            const firstSpace = content.indexOf(' ');
            const number = firstSpace > -1 ? content.slice(0, firstSpace) : content;
            const text = firstSpace > -1 ? content.slice(firstSpace + 1) : '';

            renderedElements.push(
                <div key={`nl-${index}`} className="mb-3 flex items-start gap-3 text-slate-300 print:text-slate-800">
                     <span className="font-mono text-cyber-accent font-bold mt-1 text-xs shrink-0">{number}</span>
                     <span className="leading-relaxed">{processInlineStyles(text)}</span>
                </div>
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
                let content = line;
                if ((content.match(/\*\*/g) || []).length % 2 !== 0) {
                     content += "**";
                }
                renderedElements.push(
                    <p key={`p-${index}`} className="mb-2 leading-relaxed text-slate-300 print:text-slate-800">
                        {processInlineStyles(content)}
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

// ... (imports)

// --- PRINT STYLES ---
// Enhanced print styles for professional reports
const PrintStyles = () => (
  <style>{`
    @media print {
      @page { 
        margin: 0;
        size: A4; 
      }
      body {
        background-color: white !important;
        background-image: none !important;
        color: #1f2937 !important; /* gray-800 */
        font-family: ui-sans-serif, system-ui, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Hide UI elements */
      nav, button, .fixed, .animate-pulse, .group-hover\\:opacity-100, .no-print, 
      .chat-widget, .scroll-to-top {
        display: none !important;
      }

      /* Layout Reset */
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

      /* Container Reset */
      .max-w-6xl {
        max-width: none !important;
        padding: 0 40px !important;
      }

      /* Component Overrides for White Paper Look */
      .bg-cyber-800\\/20, .bg-cyber-800\\/40, .bg-cyber-900\\/30, .bg-cyber-900\\/50 {
        background: white !important;
        border: 1px solid #e5e7eb !important; /* gray-200 */
        box-shadow: none !important;
        border-radius: 8px !important;
        margin-bottom: 20px !important;
      }

      /* Text Colors */
      .text-slate-200, .text-slate-300, .text-slate-400, .text-white {
        color: #374151 !important; /* gray-700 */
      }
      .text-cyber-accent {
        color: #0e7490 !important; /* cyan-700 - darker for print */
      }
      
      /* Typography */
      h1, h2, h3, h4 {
        color: #111827 !important; /* gray-900 */
        page-break-after: avoid;
      }
      p {
        line-height: 1.5 !important;
      }

      /* Page Breaks */
      .break-inside-avoid {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      
      /* Specific Elements */
      .rounded-xl {
        border-radius: 8px !important;
      }
      
      /* Header for Print */
      .print-header {
        display: flex !important;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #0e7490;
        padding-bottom: 20px;
        margin-bottom: 40px;
        margin-top: 40px;
      }
      
      .print-footer {
        display: flex !important;
        justify-content: space-between;
        position: fixed;
        bottom: 20px;
        left: 40px;
        right: 40px;
        font-size: 10px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
        padding-top: 10px;
      }
    }
  `}</style>
);

interface ReportOptions {
    title: string;
    logoUrl: string;
    showLogo: boolean;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ profile, analysis, onReset }) => {
  const { t } = useLanguage();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
      title: `CONFIDENTIAL DOSSIER: @${profile.username.toUpperCase()}`,
      logoUrl: "",
      showLogo: false
  });

  // ... (rest of the component)

  const handlePrint = () => {
    window.print();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setReportOptions(prev => ({ ...prev, logoUrl: reader.result as string, showLogo: true }));
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out] pb-20 relative">
      <PrintStyles />

      {/* --- PRINT ONLY HEADER --- */}
      <div className="hidden print-header flex-row justify-between items-center w-full">
          <div className="flex items-center gap-4">
              {reportOptions.showLogo && reportOptions.logoUrl ? (
                  <img src={reportOptions.logoUrl} alt="Agency Logo" className="h-12 w-auto object-contain" />
              ) : (
                  <div className="text-2xl font-bold text-gray-900 tracking-wider">ZRETI<span className="text-cyan-600">.AI</span></div>
              )}
          </div>
          <div className="text-right">
              <h1 className="text-xl font-bold text-gray-900 uppercase">{reportOptions.title}</h1>
              <div className="text-sm text-gray-500">Generated: {new Date().toLocaleDateString()}</div>
          </div>
      </div>

      {/* --- SETTINGS MODAL (UI) --- */}
      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
              <div className="bg-slate-900 border border-cyber-700 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
                  <button 
                      onClick={() => setShowSettings(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white"
                  >
                      <Check className="w-5 h-5" />
                  </button>
                  
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <Download className="w-5 h-5 text-cyber-accent" />
                      Report Settings (White Label)
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-mono text-slate-400 mb-2 uppercase">Report Title</label>
                          <input 
                              type="text" 
                              value={reportOptions.title}
                              onChange={(e) => setReportOptions(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyber-accent outline-none"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-mono text-slate-400 mb-2 uppercase">Agency Logo</label>
                          <div className="flex items-center gap-4">
                              {reportOptions.logoUrl && (
                                  <img src={reportOptions.logoUrl} className="h-10 w-10 object-contain bg-white rounded p-1" />
                              )}
                              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded border border-slate-700 text-xs flex items-center gap-2 transition-colors">
                                  <span>Upload Image...</span>
                                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                              </label>
                          </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                          <button 
                              onClick={() => { setShowSettings(false); handlePrint(); }}
                              className="bg-cyber-600 hover:bg-cyber-500 text-white font-bold py-2 px-4 rounded text-sm flex items-center gap-2"
                          >
                              <Download className="w-4 h-4" /> Save & Print PDF
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyber-700 pb-6 print:hidden">
        {/* ... existing top bar content ... */}
        <div className="flex items-center gap-4">
            <ProfileAvatar 
              src={profile.profilePicUrl} 
              alt={profile.username} 
              className="w-16 h-16 rounded-lg border border-cyber-500 shadow-[0_0_15px_rgba(34,211,238,0.2)] object-cover"
            />
            <div>
                <h1 className="text-xl md:text-2xl font-sans font-bold text-white tracking-normal">
                    <span className="text-cyber-accent/80 mr-2 font-mono text-lg md:text-xl">{t('dossier_prefix')}</span>
                    @{profile.username}
                </h1>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 mt-2">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {profile.followersCount.toLocaleString()} {t('followers')}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 opacity-70" /> {profile.followsCount.toLocaleString()} {t('following')}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {profile.postsCount.toLocaleString()} {t('posts')}</span>
                    <span className="flex items-center gap-1 text-cyber-accent"><Check className="w-3 h-3" /> {posts.length} {t('analyzed_count')}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2 no-print">
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2 bg-cyber-800 hover:bg-cyber-700 text-cyber-accent rounded border border-cyber-700 transition-colors flex items-center gap-2"
            >
               <Download className="w-4 h-4" />
               <span className="text-xs font-bold hidden md:inline">{t('btn_pdf')}</span>
            </button>
             <button 
                onClick={onReset}
                className="p-2 bg-red-950/50 hover:bg-red-900/50 text-red-400 rounded border border-red-900/50 transition-colors flex items-center gap-2"
            >
               <RefreshCw className="w-4 h-4" />
               <span className="text-xs font-bold hidden md:inline">{t('btn_new')}</span>
            </button>
        </div>
      </div>

      {/* PRINT ONLY FOOTER */}
      <div className="hidden print-footer">
          <div>Report generated by ZRETI AI Analysis Engine</div>
          <div>Page <span className="pageNumber"></span></div>
      </div>

      {/* ... rest of the dashboard components ... */}


      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('stat_likes')} value={avgLikes.toLocaleString()} subValue={t('stat_sub_likes', { count: posts.length })} icon={Heart} />
        <StatCard label={t('stat_comments')} value={avgComments.toLocaleString()} subValue={t('stat_sub_interaction')} icon={MessageCircle} />
        <StatCard 
            label={t('stat_er')} 
            value={`${er}%`} 
            subValue={parseFloat(er) > 3 ? t('er_high') : t('er_avg')} 
            icon={Activity} 
            tooltip={t('er_tooltip')}
        />
        <StatCard label={t('stat_freq')} value={frequency} subValue={t('stat_sub_consistency')} icon={Calendar} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 print:break-inside-avoid">
          <div className="bg-cyber-800/20 border border-cyber-700/50 rounded-xl p-4 backdrop-blur-sm">
               <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-cyber-accent" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t('stat_chart_title')}</h3>
               </div>
               <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(34,211,238,0.05)'}} />
                        {/* Use two Y axes to handle scale difference between likes and comments */}
                        <YAxis yAxisId="left" orientation="left" hide domain={[0, 'auto']} />
                        <YAxis yAxisId="right" orientation="right" hide domain={[0, 'auto']} />
                        
                        <Bar yAxisId="left" dataKey="likes" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar yAxisId="right" dataKey="comments" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
          </div>
      </div>

      {/* Digital Circle (Connections) */}
      <DigitalCircle profile={profile} />

      {/* Digital Footprint Section (New) */}
      {(uniqueLocations.length > 0 || uniqueMusic.length > 0 || relatedProfiles.length > 0 || pinnedPostsCount > 0) && (
          <div className="bg-cyber-900/30 border border-cyber-800 p-6 rounded-xl break-inside-avoid">
             <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-500" /> {t('footprint_title')}
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {uniqueLocations.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 uppercase tracking-widest">
                            <MapPin className="w-3 h-3" /> {t('fp_locations')}
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
                            <Music className="w-3 h-3" /> {t('fp_music')}
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
                            <Users className="w-3 h-3" /> {t('fp_circle')}
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
                            <Pin className="w-3 h-3" /> {t('fp_strategy')}
                        </div>
                        <div className="text-sm text-white font-mono">
                            {t('pinned_detected', { count: pinnedPostsCount })}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                            {t('high_priority')}
                        </div>
                    </div>
                )}
             </div>
          </div>
      )}

      {/* Report Content & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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

          {/* Sidebar: Chat Widget (Sticky) - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                  <ChatWidget profile={profile} report={analysis} />
              </div>
          </div>
      </div>
      
      {/* Mobile Chat Widget (Full Width at bottom) */}
      <div className="lg:hidden mt-8">
          <ChatWidget profile={profile} report={analysis} />
      </div>

    </div>
  );
};
