
// Input Data Types (Simulating Apify Structure)
export interface InstagramComment {
  text: string;
  ownerUsername: string;
  timestamp?: string;
}

export interface InstagramPost {
  id: string;
  type: 'Image' | 'Video' | 'Carousel';
  caption: string;
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  latestComments: InstagramComment[]; // New field for text analysis
  timestamp: string;
  displayUrl: string;
  videoViewCount?: number;
}

export interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  profilePicUrl: string;
  posts: InstagramPost[];
  externalUrl?: string;
  isVerified: boolean;
  _rawDebug?: any;
}

// The result is now a parsed report structure
export interface StrategicReport {
  rawText: string;
  sections: { title: string; content: string }[];
  visionAnalysis: string[]; // New field to store image descriptions for the chat context
}
