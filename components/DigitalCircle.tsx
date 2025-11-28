import React from 'react';
import { InstagramProfile } from '../types';
import { analyzeConnections } from '../utils/analytics';
import { Users, AtSign, MessageCircle, GitMerge } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DigitalCircleProps {
    profile: InstagramProfile;
}

export const DigitalCircle: React.FC<DigitalCircleProps> = ({ profile }) => {
    const { t, language } = useLanguage();
    const connections = analyzeConnections(profile);

    if (connections.length === 0) return null;

    return (
        <div className="digital-circle-component bg-cyber-800/20 border border-cyber-700/50 rounded-xl p-6 backdrop-blur-sm break-inside-avoid relative overflow-hidden print:!bg-white print:!border-slate-300">

            <div className="flex items-center gap-2 mb-6 relative z-10">
                <GitMerge className="w-4 h-4 text-cyber-accent" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider print:!text-black">{t('circle_title')}</h3>
            </div>

            {/* Grid of connections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {connections.map((user, idx) => {
                    const formatDate = (dateStr?: string) => {
                        if (!dateStr) return language === 'ru' ? 'Н/Д' : 'N/A';
                        try {
                            const date = new Date(dateStr);
                            const locale = language === 'ru' ? 'ru-RU' : 'en-US';
                            return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
                        } catch {
                            return language === 'ru' ? 'Н/Д' : 'N/A';
                        }
                    };

                    return (
                    <div key={user.username} className="relative group/tooltip">
                        <a
                            href={`https://instagram.com/${user.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-cyber-accent/30 p-3 pr-4 rounded-lg transition-all duration-300 print:!bg-white print:!border-slate-200"
                        >
                        <div className="relative shrink-0">
                            {/* Avatar Placeholder */}
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700 group-hover:border-cyber-accent/50 transition-colors print:!bg-slate-100 print:!border-slate-300 print:!text-slate-600">
                                <Users className="w-5 h-5" />
                            </div>

                            {/* Rank Badge */}
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-900 border border-cyber-accent/50 rounded-full flex items-center justify-center text-[8px] font-bold text-cyber-accent print:!bg-white print:!border-slate-400 print:!text-black">
                                {idx + 1}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 overflow-hidden print:!overflow-visible">
                            <div className="text-xs font-bold text-slate-200 group-hover:text-cyber-accent truncate print:!text-black print:!whitespace-normal print:!overflow-visible print:!truncate">
                                @{user.username}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {user.type === 'mixed' && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 print:!text-purple-700 print:!border-purple-300 print:!bg-purple-50">
                                        {t('badge_close')}
                                    </span>
                                )}
                                {user.type === 'tagged' && (
                                    <span className="flex items-center gap-1 text-[9px] text-slate-500 shrink-0 print:!text-slate-600">
                                        <AtSign className="w-3 h-3" /> {t('badge_tagged')}
                                    </span>
                                )}
                                {user.type === 'commenter' && (
                                    <span className="flex items-center gap-1 text-[9px] text-slate-500 shrink-0 print:!text-slate-600">
                                        <MessageCircle className="w-3 h-3" /> {t('badge_active')}
                                    </span>
                                )}
                                {user.type === 'mentioned' && (
                                    <span className="flex items-center gap-1 text-[9px] text-cyan-500 shrink-0 print:!text-cyan-700">
                                        <AtSign className="w-3 h-3" /> {t('badge_mentioned')}
                                    </span>
                                )}
                                <span className="text-[9px] text-slate-600 font-mono shrink-0 print:!text-slate-500">
                                    {t('circle_score_label')}: {isNaN(user.count) || !isFinite(user.count) ? '0.0' : user.count.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </a>
                    
                    {/* Tooltip with detailed information */}
                    {user.details && (
                        <div className={`absolute left-1/2 -translate-x-1/2 w-64 p-3 bg-[#020617] border border-cyber-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 leading-relaxed shadow-[0_0_30px_rgba(0,0,0,0.5)] print:hidden ${
                            idx < 4 
                                ? 'top-full mt-2' // For first row: show below
                                : 'bottom-full mb-2' // For other rows: show above
                        }`}>
                            <div className="font-bold text-cyber-accent mb-2 text-xs">@{user.username}</div>
                            <div className="space-y-1">
                                {user.details.tags > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">{t('circle_tooltip_tags')}:</span>
                                        <span className="font-mono text-white">{user.details.tags.toFixed(1)}</span>
                                    </div>
                                )}
                                {user.details.comments > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">{t('circle_tooltip_comments')}:</span>
                                        <span className="font-mono text-white">{user.details.comments.toFixed(1)}</span>
                                    </div>
                                )}
                                {user.details.mentions > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">{t('circle_tooltip_mentions')}:</span>
                                        <span className="font-mono text-white">{user.details.mentions.toFixed(1)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-400">{t('circle_tooltip_posts')}:</span>
                                    <span className="font-mono text-white">{user.details.postCount}</span>
                                </div>
                                {user.lastInteraction && (
                                    <div className="flex justify-between pt-1 border-t border-cyber-700 mt-1">
                                        <span className="text-slate-400">{t('circle_tooltip_last')}:</span>
                                        <span className="font-mono text-white text-[9px]">{formatDate(user.lastInteraction)}</span>
                                    </div>
                                )}
                            </div>
                            {/* Arrow - position depends on tooltip position */}
                            {idx < 4 ? (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-px border-4 border-transparent border-b-cyber-700"></div>
                            ) : (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-cyber-700"></div>
                            )}
                        </div>
                    )}
                </div>
                );
                })}
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
};

