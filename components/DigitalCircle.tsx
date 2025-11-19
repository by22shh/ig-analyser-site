import React from 'react';
import { InstagramProfile } from '../types';
import { analyzeConnections } from '../utils/analytics';
import { Users, AtSign, MessageCircle, GitMerge } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';

interface DigitalCircleProps {
  profile: InstagramProfile;
}

export const DigitalCircle: React.FC<DigitalCircleProps> = ({ profile }) => {
  const connections = analyzeConnections(profile);

  if (connections.length === 0) return null;

  return (
    <div className="bg-cyber-800/20 border border-cyber-700/50 rounded-xl p-6 backdrop-blur-sm break-inside-avoid relative overflow-hidden">
      
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <GitMerge className="w-4 h-4 text-cyber-accent" />
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Digital Circle (Близкие связи)</h3>
      </div>

      {/* Grid of connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {connections.map((user, idx) => (
            <a 
                key={user.username}
                href={`https://instagram.com/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-cyber-accent/30 p-3 rounded-lg transition-all duration-300"
            >
                <div className="relative">
                     {/* Avatar Placeholder (Using our component would require scraping avatar URL separately, which we don't have for connected users yet. 
                         We can assume we don't have their pic unless we scrape them. 
                         Wait, we don't have URLs for commenters/tagged users in the current scraping dataset usually, 
                         unless 'latestComments' object is rich. Let's check types.
                         InstagramComment only has 'ownerUsername'. So no pic. 
                         We will use a generated avatar or just icon. 
                     */}
                     <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700 group-hover:border-cyber-accent/50 transition-colors">
                         <Users className="w-5 h-5" />
                     </div>
                     
                     {/* Rank Badge */}
                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-900 border border-cyber-accent/50 rounded-full flex items-center justify-center text-[8px] font-bold text-cyber-accent">
                         {idx + 1}
                     </div>
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-200 group-hover:text-cyber-accent truncate">
                        @{user.username}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        {user.type === 'mixed' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Close
                            </span>
                        )}
                        {user.type === 'tagged' && (
                            <span className="flex items-center gap-1 text-[9px] text-slate-500">
                                <AtSign className="w-3 h-3" /> Tagged
                            </span>
                        )}
                        {user.type === 'commenter' && (
                            <span className="flex items-center gap-1 text-[9px] text-slate-500">
                                <MessageCircle className="w-3 h-3" /> Active
                            </span>
                        )}
                        <span className="text-[9px] text-slate-600 ml-auto font-mono">
                            x{user.count}
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

