import React from 'react';
import { InstagramPost } from '../types';
import { Clock, Calendar } from 'lucide-react';

interface ActivityHeatmapProps {
  posts: InstagramPost[];
}

// Helper to get Russian day names
const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const TIME_SLOTS = ['Ночь (00-06)', 'Утро (06-12)', 'День (12-18)', 'Вечер (18-24)'];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ posts }) => {
  
  // 1. Prepare Data Matrix [7 days][4 time slots]
  // Initialize with 0
  const matrix = Array(7).fill(0).map(() => Array(4).fill(0));
  let maxCount = 0;

  posts.forEach(post => {
    const date = new Date(post.timestamp);
    const day = date.getDay(); // 0 (Sun) - 6 (Sat)
    const hour = date.getHours();
    
    // Map hour to time slot (0-3)
    let slot = 0;
    if (hour >= 6 && hour < 12) slot = 1;
    else if (hour >= 12 && hour < 18) slot = 2;
    else if (hour >= 18) slot = 3;

    matrix[day][slot]++;
    if (matrix[day][slot] > maxCount) maxCount = matrix[day][slot];
  });

  // Adjust Sunday to be the last day for RU locale (Mon-Sun) if desired, 
  // but standard getDay() is Sun=0. Let's stick to standard or rotate.
  // Let's rotate to make Monday first (index 1) -> Sunday last (index 0 moved to 7)
  // Visual Order: Mon (1), Tue (2)... Sat (6), Sun (0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="bg-cyber-800/20 border border-cyber-700/50 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden break-inside-avoid">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-4 h-4 text-cyber-accent" />
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ритм публикаций (Heatmap)</h3>
      </div>

      {/* Grid Container */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[300px]">
            
          {/* Header Row (Time Slots) */}
          <div className="grid grid-cols-5 gap-2 mb-2">
            <div className="text-[10px] text-slate-500 font-mono"></div> {/* Spacer for Day labels */}
            {TIME_SLOTS.map((slot, i) => (
                <div key={i} className="text-[9px] text-slate-400 font-mono uppercase text-center">
                    {slot.split(' ')[0]}
                </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {orderedDays.map((dayIndex) => (
            <div key={dayIndex} className="grid grid-cols-5 gap-2 mb-2 items-center">
              {/* Day Label */}
              <div className="text-[10px] text-slate-400 font-mono font-bold">
                {DAYS[dayIndex]}
              </div>

              {/* Cells */}
              {matrix[dayIndex].map((count, slotIndex) => {
                // Calculate opacity/intensity
                // If maxCount is small (e.g. 1), avoid full saturation issues. 
                // If count 0 -> opacity 0.1
                // If count > 0 -> calculate based on max
                const intensity = maxCount > 0 ? (count / maxCount) : 0;
                
                return (
                  <div 
                    key={slotIndex}
                    className="relative group h-8 rounded md:rounded-md transition-all duration-300 border border-transparent hover:border-white/30"
                    style={{
                        backgroundColor: count > 0 
                            ? `rgba(34, 211, 238, ${0.15 + (intensity * 0.85)})` // Cyan base
                            : 'rgba(30, 41, 59, 0.5)' // Slate-800 equivalent
                    }}
                  >
                    {count > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90 shadow-sm">
                            {count}
                        </div>
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-cyber-accent/30">
                         {DAYS[dayIndex]}, {TIME_SLOTS[slotIndex]}: <span className="text-cyber-accent font-bold">{count} пост(ов)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-500 font-mono border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-800"></div>
              <span>0 постов</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyber-accent/40"></div>
              <span>Редко</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyber-accent"></div>
              <span>Часто</span>
          </div>
      </div>
    </div>
  );
};

