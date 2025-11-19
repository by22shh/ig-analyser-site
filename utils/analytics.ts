import { InstagramProfile } from '../types';

export interface InteractionUser {
  username: string;
  count: number;
  type: 'tagged' | 'commenter' | 'mixed';
  lastInteraction?: string; // date
}

export const analyzeConnections = (profile: InstagramProfile): InteractionUser[] => {
  const interactions: Record<string, { tags: number; comments: number; lastDate: string }> = {};

  profile.posts.forEach(post => {
    // 1. Analyze Tagged Users
    if (post.taggedUsers && post.taggedUsers.length > 0) {
        post.taggedUsers.forEach(user => {
            if (!interactions[user]) {
                interactions[user] = { tags: 0, comments: 0, lastDate: post.timestamp };
            }
            interactions[user].tags += 1;
            if (new Date(post.timestamp) > new Date(interactions[user].lastDate)) {
                interactions[user].lastDate = post.timestamp;
            }
        });
    }

    // 2. Analyze Commenters
    if (post.latestComments && post.latestComments.length > 0) {
        post.latestComments.forEach(comment => {
            // Exclude the post owner themselves
            if (comment.ownerUsername === profile.username) return;

            const user = comment.ownerUsername;
            if (!interactions[user]) {
                interactions[user] = { tags: 0, comments: 0, lastDate: comment.timestamp || post.timestamp };
            }
            interactions[user].comments += 1;
        });
    }
  });

  // Convert to array and sort
  const sortedUsers = Object.entries(interactions).map(([username, data]) => {
      let type: 'tagged' | 'commenter' | 'mixed' = 'commenter';
      if (data.tags > 0 && data.comments > 0) type = 'mixed';
      else if (data.tags > 0) type = 'tagged';

      return {
          username,
          count: data.tags + data.comments, // Total interaction score
          type,
          lastInteraction: data.lastDate,
          details: data
      };
  })
  .sort((a, b) => b.count - a.count) // Sort by frequency high to low
  .slice(0, 8); // Top 8

  return sortedUsers;
};

