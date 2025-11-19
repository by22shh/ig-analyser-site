import { InstagramProfile, StrategicReport } from '../types';

const STORAGE_KEY = 'zreti_recent_searches_v1';
const MAX_HISTORY_ITEMS = 5;

export interface HistoryItem {
  username: string;
  timestamp: number;
  profileData?: InstagramProfile; // Optional: cache profile data
  reportData?: StrategicReport;   // Optional: cache full report
}

export const getSearchHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse search history', e);
    return [];
  }
};

export const addToSearchHistory = (
  username: string, 
  profileData?: InstagramProfile,
  reportData?: StrategicReport
) => {
  try {
    const currentHistory = getSearchHistory();
    
    // Remove existing entry for this user if present (to move it to top)
    const filteredHistory = currentHistory.filter(
      item => item.username.toLowerCase() !== username.toLowerCase()
    );

    const newItem: HistoryItem = {
      username,
      timestamp: Date.now(),
      // We only store LIGHT data to avoid localStorage limits (5MB)
      // Storing full reports might be too heavy if they have base64 images? 
      // Our types don't store base64, just URLs, so it might be okay.
      // Let's try storing it for instant load!
      profileData,
      reportData
    };

    const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.warn('Failed to save search history (quota exceeded?)', e);
  }
};

export const clearSearchHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

