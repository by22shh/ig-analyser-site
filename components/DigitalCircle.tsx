import React from 'react';
import { InstagramProfile } from '../types';
import { analyzeConnections } from '../utils/analytics';
import { Users, AtSign, MessageCircle, GitMerge } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DigitalCircleProps {
    profile: InstagramProfile;
}

export const DigitalCircle: React.FC<DigitalCircleProps> = ({ profile }) => {
    const { t } = useLanguage();
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
                {connections.map((user, idx) => (
                    <a
                        key={user.username}
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
                                    {user.count.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
};

