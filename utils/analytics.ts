import { InstagramProfile } from '../types';

export interface InteractionUser {
  username: string;
  count: number;
  type: 'tagged' | 'commenter' | 'mixed' | 'mentioned';
  lastInteraction?: string; // date
}

// Configuration for scoring weights
const SCORING_WEIGHTS = {
  tag: 2.0,           // Being tagged in a post (strong signal)
  mention: 1.5,       // Being mentioned in caption (@username)
  comment: 1.0,       // Base comment weight
  commentLength: 0.1, // Bonus per character in comment (max +2.0 for 20+ chars)
  recency: 1.5,       // Multiplier for recent interactions (last 30 days)
  regularity: 0.5,   // Bonus for interacting across multiple posts
};

// Minimum comment length to avoid spam/bots
const MIN_COMMENT_LENGTH = 3;

// Calculate recency multiplier (1.0 for old, 1.5 for recent)
const getRecencyMultiplier = (postDate: Date, oldestPostDate: Date): number => {
  const daysSinceOldest = (postDate.getTime() - oldestPostDate.getTime()) / (1000 * 60 * 60 * 24);
  const totalDays = 30; // We analyze last 30 posts, roughly 30-90 days range
  if (daysSinceOldest < totalDays) {
    return SCORING_WEIGHTS.recency; // Recent interactions get boost
  }
  return 1.0; // Older interactions
};

// Check if comment is likely spam/bot
const isSpamComment = (commentText: string): boolean => {
  const text = commentText.trim().toLowerCase();
  // Very short comments or common spam patterns
  if (text.length < MIN_COMMENT_LENGTH) return true;
  const spamPatterns = ['🔥', '❤️', '👍', 'nice', 'cool', 'wow', 'amazing'];
  return spamPatterns.includes(text) && text.length < 10;
};

export const analyzeConnections = (profile: InstagramProfile): InteractionUser[] => {
  const interactions: Record<string, { 
    tags: number; 
    comments: number; 
    mentions: number;
    commentLength: number;
    postCount: number; // How many different posts they interacted with
    lastDate: string;
    firstDate: string;
  }> = {};

  // Find oldest post date for recency calculation
  const postDates = profile.posts.map(p => new Date(p.timestamp)).sort((a, b) => a.getTime() - b.getTime());
  const oldestPostDate = postDates[0] || new Date();

  profile.posts.forEach(post => {
    const postDate = new Date(post.timestamp);
    const recencyMultiplier = getRecencyMultiplier(postDate, oldestPostDate);

    // 1. Analyze Tagged Users (highest weight - being in photo)
    if (post.taggedUsers && post.taggedUsers.length > 0) {
        post.taggedUsers.forEach(user => {
            if (!interactions[user]) {
                interactions[user] = { 
                  tags: 0, 
                  comments: 0, 
                  mentions: 0,
                  commentLength: 0,
                  postCount: 0,
                  lastDate: post.timestamp,
                  firstDate: post.timestamp
                };
            }
            interactions[user].tags += SCORING_WEIGHTS.tag * recencyMultiplier;
            interactions[user].postCount += 1;
            if (new Date(post.timestamp) > new Date(interactions[user].lastDate)) {
                interactions[user].lastDate = post.timestamp;
            }
            if (new Date(post.timestamp) < new Date(interactions[user].firstDate)) {
                interactions[user].firstDate = post.timestamp;
            }
        });
    }

    // 2. Analyze Mentions in Captions (@username)
    if (post.mentions && post.mentions.length > 0) {
        post.mentions.forEach(mentionedUser => {
            // Normalize username (remove @ if present)
            const user = mentionedUser.replace('@', '').toLowerCase();
            if (user === profile.username.toLowerCase()) return; // Skip self-mentions
            
            if (!interactions[user]) {
                interactions[user] = { 
                  tags: 0, 
                  comments: 0, 
                  mentions: 0,
                  commentLength: 0,
                  postCount: 0,
                  lastDate: post.timestamp,
                  firstDate: post.timestamp
                };
            }
            interactions[user].mentions += SCORING_WEIGHTS.mention * recencyMultiplier;
            interactions[user].postCount += 1;
            if (new Date(post.timestamp) > new Date(interactions[user].lastDate)) {
                interactions[user].lastDate = post.timestamp;
            }
        });
    }

    // 3. Analyze Commenters (with quality scoring)
    if (post.latestComments && post.latestComments.length > 0) {
        post.latestComments.forEach(comment => {
            // Exclude the post owner themselves
            if (comment.ownerUsername === profile.username) return;
            
            // Filter spam comments
            if (isSpamComment(comment.text || '')) return;

            const user = comment.ownerUsername;
            if (!interactions[user]) {
                interactions[user] = { 
                  tags: 0, 
                  comments: 0, 
                  mentions: 0,
                  commentLength: 0,
                  postCount: 0,
                  lastDate: comment.timestamp || post.timestamp,
                  firstDate: comment.timestamp || post.timestamp
                };
            }
            
            // Base comment score
            const commentScore = SCORING_WEIGHTS.comment * recencyMultiplier;
            
            // Quality bonus based on comment length (longer = more meaningful)
            const commentLength = (comment.text || '').length;
            const lengthBonus = Math.min(commentLength * SCORING_WEIGHTS.commentLength, 2.0);
            
            interactions[user].comments += commentScore;
            interactions[user].commentLength += lengthBonus;
            interactions[user].postCount += 1;
            
            const commentDate = comment.timestamp || post.timestamp;
            if (new Date(commentDate) > new Date(interactions[user].lastDate)) {
                interactions[user].lastDate = commentDate;
            }
            if (new Date(commentDate) < new Date(interactions[user].firstDate)) {
                interactions[user].firstDate = commentDate;
            }
        });
    }
  });

  // Convert to array and calculate final scores
  const sortedUsers = Object.entries(interactions).map(([username, data]) => {
      // Determine type
      let type: 'tagged' | 'commenter' | 'mixed' | 'mentioned' = 'commenter';
      if (data.tags > 0 && data.comments > 0) type = 'mixed';
      else if (data.tags > 0) type = 'tagged';
      else if (data.mentions > 0 && data.comments === 0) type = 'mentioned';
      
      // Calculate total score with bonuses
      const baseScore = data.tags + data.comments + data.mentions;
      const qualityBonus = data.commentLength; // Bonus for meaningful comments
      const regularityBonus = data.postCount >= 5 ? SCORING_WEIGHTS.regularity * (data.postCount - 4) : 0; // Bonus for interacting across many posts
      
      const totalScore = baseScore + qualityBonus + regularityBonus;

      return {
          username,
          count: Math.round(totalScore * 10) / 10, // Round to 1 decimal
          type,
          lastInteraction: data.lastDate,
          details: data
      };
  })
  .sort((a, b) => b.count - a.count) // Sort by score high to low
  .slice(0, 8); // Top 8

  return sortedUsers;
};

