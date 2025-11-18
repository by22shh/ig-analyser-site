
import { InstagramProfile, InstagramPost } from "../types";

/**
 * PRODUCTION MODE:
 * 1. Validates Apify Token (No mock fallback).
 * 2. Calls Apify API to start 'apify/instagram-scraper'.
 * 3. Polls for the run to finish with extended timeout.
 * 4. Fetches and maps dataset items.
 */
export const fetchInstagramData = async (
  username: string,
  apifyToken: string | null
): Promise<InstagramProfile> => {
  
  // STRICT VALIDATION: No token = Error
  if (!apifyToken || apifyToken.trim() === "") {
    throw new Error("Apify API Token is required. Demo mode is disabled.");
  }

  try {
    // 1. Start Actor
    // Using 'apify/instagram-scraper' (ensure you have access/rights)
    const startUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${apifyToken}`;
    
    // NOTE: Using the specific JSON configuration provided by the user for best results.
    // We use 'directUrls' to force the scraper to visit the specific profile URL.
    // CRITICAL UPDATE: 'addParentData: true' ensures we get Bio/Followers count attached to posts.
    const runResponse = await fetch(startUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${username}`],
        resultsLimit: 10, // UPDATED: 10 posts analyzed
        resultsType: "posts",
        searchType: "hashtag", 
        enhanceUserSearchWithFacebookPage: false,
        isUserReelFeedURL: false,
        addParentData: true, // CHANGED: Must be true to get Profile Bio/Stats in a "posts" search
        isUserTaggedFeedURL: false,
      })
    });

    if (!runResponse.ok) {
      if (runResponse.status === 401) {
        throw new Error("Invalid Apify API Token. Please check your credentials.");
      }
      const err = await runResponse.json();
      throw new Error(`Apify Start Error: ${err.error?.message || runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const datasetId = runData.data.defaultDatasetId;
    const runId = runData.data.id;

    // 2. Poll for completion
    // Increased timeout for production reality (Instagram scraping is slow)
    await waitForRunToFinish(runId, apifyToken);

    // 3. Fetch Results
    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`;
    const dataResponse = await fetch(datasetUrl);
    const items = await dataResponse.json();

    if (!items || items.length === 0) {
        throw new Error("Profile not found, private, or scraping failed to retrieve items.");
    }

    // STRICT VALIDATION: Verify username match
    // Instagram scraper might return related users or fuzzy matches if the specific user isn't found/accessible.
    const normalizedTarget = username.toLowerCase();
    
    const validItems = items.filter((item: any) => {
        const itemUser = (item.ownerUsername || item.owner?.username || "").toLowerCase();
        // Allow exact match OR check if inputUrl contains the username (common in Apify results)
        return itemUser === normalizedTarget || (item.inputUrl && item.inputUrl.includes(normalizedTarget));
    });

    if (validItems.length === 0) {
        // If strict filter fails, throw error to prevent hallucination on wrong profile
        const foundUser = items[0]?.ownerUsername || items[0]?.owner?.username || "Unknown";
        throw new Error(`Identity Mismatch: Scraped data belongs to '@${foundUser}', but you requested '@${username}'. The profile might be private or shadowbanned.`);
    }
    
    // Use validItems or items if we trust directUrl implicitly (logic above filters strictly)
    const finalItems = validItems.length > 0 ? validItems : items;

    // 4. Map Apify specific raw data to our standardized Interface
    
    // ROBUST EXTRACTION: Find the item that has the most complete owner data
    // Sometimes the first item misses 'owner' details but the second one has it.
    const itemWithProfileStats = finalItems.find((i: any) => i.owner && i.owner.followersCount !== undefined) || finalItems[0];
    
    const owner = itemWithProfileStats.owner || {};
    
    // Construct posts array. Filter out non-post items if necessary.
    const posts: InstagramPost[] = finalItems.map((item: any, index: number) => ({
        id: item.id || item.shortCode || index.toString(),
        type: item.type || (item.isVideo ? 'Video' : 'Image'),
        caption: item.caption || '',
        hashtags: item.hashtags || [],
        mentions: item.mentions || [],
        likesCount: item.likesCount || 0,
        commentsCount: item.commentsCount || 0,
        // Extract text comments if available (apify often returns `latestComments`)
        latestComments: Array.isArray(item.latestComments) 
            ? item.latestComments.map((c: any) => ({
                text: c.text || "",
                ownerUsername: c.ownerUsername || "user",
                timestamp: c.timestamp
              })) 
            : [],
        timestamp: item.timestamp || new Date().toISOString(),
        displayUrl: item.displayUrl || item.url || "https://picsum.photos/400/400",
    })).slice(0, 10);

    return {
        username: itemWithProfileStats.ownerUsername || owner.username || username,
        fullName: itemWithProfileStats.ownerFullName || owner.fullName || "Unknown",
        biography: itemWithProfileStats.biography || owner.biography || "",
        // Prioritize owner object stats, fall back to item root stats
        followersCount: owner.followersCount || itemWithProfileStats.followersCount || 0,
        followsCount: owner.followsCount || itemWithProfileStats.followsCount || 0,
        postsCount: owner.postsCount || itemWithProfileStats.postsCount || posts.length,
        profilePicUrl: owner.profilePicUrl || itemWithProfileStats.profilePicUrl || "https://picsum.photos/200/200",
        isVerified: owner.isVerified || itemWithProfileStats.isVerified || false,
        posts: posts,
        // Store the valid items for debugging in the UI
        _rawDebug: finalItems.slice(0, 5) 
    };

  } catch (error: any) {
    console.warn("Apify Data Fetch Failed:", error);
    // Enhance error message for UI
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Network error connecting to Apify. Check your internet connection.");
    }
    throw error; 
  }
};

const waitForRunToFinish = async (runId: string, token: string) => {
    let status = "RUNNING";
    let attempts = 0;
    // Wait up to ~3 minutes (45 * 4s)
    const maxAttempts = 45;
    
    while((status === "RUNNING" || status === "READY") && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 4000));
        const res = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs/${runId}?token=${token}`);
        if (!res.ok) {
             if(res.status === 401) throw new Error("Apify Token invalid during polling.");
             if(res.status === 404) throw new Error("Apify Run ID lost.");
        }
        const data = await res.json();
        status = data.data.status;
        attempts++;
    }

    if (status !== "SUCCEEDED") {
        throw new Error(`Scraper run failed or timed out with status: ${status}`);
    }
};
