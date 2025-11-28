
import { InstagramProfile, InstagramPost } from "../types";

// Helper for robust fetching with retries
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            // If 5xx error, throw to trigger retry. 4xx errors are usually permanent (client error).
            if (res.status >= 500) {
                throw new Error(`Server error: ${res.status}`);
            }
            return res;
        } catch (err) {
            lastError = err;
            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // Exponential backoff
            }
        }
    }
    throw lastError;
}

/**
 * PRODUCTION MODE:
 * 1. Validates Apify Token.
 * 2. Calls Apify API to start 'apify/instagram-scraper'.
 * 3. Polls for the run to finish with extended timeout.
 * 4. Fetches and maps dataset items.
 */
export const fetchInstagramData = async (
  username: string,
  apifyToken: string | null
): Promise<InstagramProfile> => {
  
  if (!apifyToken || apifyToken.trim() === "") {
    throw new Error("Apify API Token is required. Please check your configuration.");
  }

  try {
    // 1. Start Actor
    const startUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${apifyToken}`;
    
    const runResponse = await fetchWithRetry(startUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${username}`],
        resultsLimit: 35, // Fetch slightly more to account for pinned posts/ads
        resultsType: "posts",
        searchType: "hashtag", 
        enhanceUserSearchWithFacebookPage: false,
        isUserReelFeedURL: false,
        addParentData: true, 
        isUserTaggedFeedURL: false,
      })
    });

    if (!runResponse.ok) {
      if (runResponse.status === 401) {
        throw new Error("Invalid Apify API Token. Please check your credentials.");
      }
      const err = await runResponse.json().catch(() => ({}));
      throw new Error(`Apify Start Error: ${err.error?.message || runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const datasetId = runData.data.defaultDatasetId;
    const runId = runData.data.id;

    // 2. Poll for completion
    await waitForRunToFinish(runId, apifyToken);

    // 3. Fetch Results
    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`;
    const dataResponse = await fetchWithRetry(datasetUrl, { method: 'GET' });
    const items = await dataResponse.json();

    if (!items || items.length === 0) {
        throw new Error(`Profile @${username} not found or private. Apify returned no data.`);
    }

    // STRICT VALIDATION: Verify username match
    // Instagram scraper might return related users if the main one is private/not found.
    const normalizedTarget = username.toLowerCase();
    
    const validItems = items.filter((item: any) => {
        const itemUser = (item.ownerUsername || item.owner?.username || "").toLowerCase();
        const inputUrl = (item.inputUrl || "").toLowerCase();
        // Check if the item belongs to the user OR if the input URL explicitly targeted them
        return itemUser === normalizedTarget || inputUrl.includes(normalizedTarget);
    });

    if (validItems.length === 0) {
         const potentialUser = items[0];
         if (potentialUser && (potentialUser.username || potentialUser.ownerUsername)?.toLowerCase() === normalizedTarget) {
             // It's a match, just maybe no posts
         } else {
             const foundUser = items[0]?.ownerUsername || items[0]?.owner?.username || "Unknown";
             throw new Error(`Identity Mismatch: Scraped data belongs to '@${foundUser}', but you requested '@${username}'.`);
         }
    }
    
    const finalItems = validItems.length > 0 ? validItems : items;

    // 4. Map Apify specific raw data to our standardized Interface
    const itemWithProfileStats = finalItems.find((i: any) => i.owner && i.owner.followersCount !== undefined) || finalItems[0];
    const owner = itemWithProfileStats.owner || {};
    const metaData = itemWithProfileStats.metaData || {};
    
    // Extract best possible profile picture (Priority: HD Info -> Standard -> Fallback)
    const hdProfilePic = owner.hdProfilePicUrlInfo?.url || owner.hd_profile_pic_url_info?.url;
    const profilePicUrl = hdProfilePic || owner.profilePicUrl || itemWithProfileStats.profilePicUrl || "https://picsum.photos/200/200";

    const posts: InstagramPost[] = finalItems
        .filter((item:any) => item.type !== 'GraphSidecar' || item.displayUrl) 
        .map((item: any, index: number) => {
            
            // Extract Child Posts (Images from Carousel)
            let childPosts: string[] = [];
            if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                childPosts = item.images.filter((url: any) => typeof url === 'string');
            } else if (item.childPosts && Array.isArray(item.childPosts)) {
                childPosts = item.childPosts.map((c: any) => c.displayUrl || c.url).filter(Boolean);
            }

            // Extract Location
            const locationName = item.locationName || item.location?.name;
            const locationId = item.locationId || item.location?.id;
            
            // Extract Music
            let musicInfo = undefined;
            if (item.musicInfo) {
                musicInfo = {
                    artist: item.musicInfo.artist_name || "",
                    song: item.musicInfo.song_name || ""
                };
            }

            return {
                id: item.id || item.shortCode || index.toString(),
                type: item.type || (item.isVideo ? 'Video' : 'Image'),
                caption: item.caption || '',
                hashtags: item.hashtags || [],
                mentions: item.mentions || [],
                likesCount: item.likesCount || 0,
                commentsCount: item.commentsCount || 0,
                latestComments: Array.isArray(item.latestComments) 
                    ? item.latestComments.map((c: any) => ({
                        text: c.text || "",
                        ownerUsername: c.ownerUsername || "user",
                        timestamp: c.timestamp
                    })) 
                    : [],
                timestamp: item.timestamp || new Date().toISOString(),
                displayUrl: item.displayUrl || item.url || "https://picsum.photos/400/400",
                url: item.url || (item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/` : undefined),
                
                // New Fields
                videoViewCount: item.videoViewCount || item.videoPlayCount,
                videoDuration: item.videoDuration,
                isPinned: item.isPinned || false,
                location: locationName ? { name: locationName, id: locationId } : undefined,
                productType: item.productType, // 'clips', 'feed', 'igtv'
                musicInfo: musicInfo,
                childPosts: childPosts,
                taggedUsers: item.taggedUsers ? item.taggedUsers.map((u:any) => u.username) : []
            };
        })
        .sort((a: InstagramPost, b: InstagramPost) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Sort by date descending (newest first)
        .slice(0, 30); // Take 30 most recent posts for consistent results

    // Map Related Profiles
    const relatedProfiles = metaData.relatedProfiles?.map((rp: any) => ({
        username: rp.username,
        fullName: rp.full_name || rp.fullName,
        isVerified: rp.is_verified || rp.isVerified || false
    })) || [];

    return {
        username: itemWithProfileStats.ownerUsername || owner.username || username,
        fullName: itemWithProfileStats.ownerFullName || owner.fullName || "Unknown",
        biography: itemWithProfileStats.biography || owner.biography || "",
        followersCount: owner.followersCount || itemWithProfileStats.followersCount || 0,
        followsCount: owner.followsCount || itemWithProfileStats.followsCount || 0,
        postsCount: owner.postsCount || itemWithProfileStats.postsCount || posts.length,
        profilePicUrl: profilePicUrl,
        isVerified: owner.isVerified || itemWithProfileStats.isVerified || false,
        posts: posts,
        relatedProfiles: relatedProfiles,
        _rawDebug: finalItems.slice(0, 1) 
    };

  } catch (error: any) {
    console.warn("Apify Data Fetch Failed:", error);
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Network error connecting to Apify. Check your internet connection.");
    }
    throw error; 
  }
};

const waitForRunToFinish = async (runId: string, token: string) => {
    let status = "RUNNING";
    let attempts = 0;
    const maxAttempts = 60; 
    
    while((status === "RUNNING" || status === "READY") && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 4000));
        
        try {
            const res = await fetchWithRetry(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs/${runId}?token=${token}`, { method: 'GET' });
            if (!res.ok) {
                 if(res.status === 401) throw new Error("Apify Token invalid during polling.");
                 if(res.status === 404) throw new Error("Apify Run ID lost.");
            }
            const data = await res.json();
            status = data.data.status;
        } catch (e) {
            console.warn("Polling error, retrying...", e);
        }
        
        attempts++;
    }

    if (status !== "SUCCEEDED") {
        throw new Error(`Scraper run failed or timed out with status: ${status}`);
    }
};
