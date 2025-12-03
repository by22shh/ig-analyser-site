
// Input Data Types (Simulating Apify Structure)
export interface InstagramComment {
  text: string;
  ownerUsername: string;
  timestamp?: string;
}

export interface InstagramPost {
  id: string;
  type: 'Image' | 'Video' | 'Carousel' | 'Sidecar';
  caption: string;
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  latestComments: InstagramComment[];
  timestamp: string;
  displayUrl: string;
  url?: string; // Permalink to the post
  videoViewCount?: number;
  videoDuration?: number;

  // Rich Metadata
  location?: {
    name: string;
    id?: string;
  };
  isPinned: boolean;
  productType?: string; // 'clips', 'feed', 'igtv'
  musicInfo?: {
    artist: string;
    song: string;
  };
  childPosts?: string[]; // URLs of images in a carousel
  taggedUsers?: string[];
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

  // Rich Metadata
  relatedProfiles?: {
    username: string;
    fullName: string;
    isVerified: boolean;
  }[];

  _rawDebug?: any;
}

// The result is now a parsed report structure
export interface StrategicReport {
  rawText: string;
  sections: { title: string; content: string }[];
  visionAnalysis: string[];
}

// Yandex Image Search Types
export interface YandexImageResult {
  url: string;
  format: 'IMAGE_FORMAT_JPEG' | 'IMAGE_FORMAT_GIF' | 'IMAGE_FORMAT_PNG';
  width: string;
  height: string;
  passage: string;
  host: string;
  pageTitle: string;
  pageUrl: string;
}

export interface YandexImageSearchResponse {
  images: YandexImageResult[];
  page: string;
  id: string; // CBIR ID for pagination
}

export interface InstagramMatch {
  username: string;
  profileUrl: string;
  confidence: number; // 0-100
  source: 'url' | 'title' | 'description';
}
