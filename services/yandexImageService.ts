import { YandexImageSearchResponse, YandexImageResult, InstagramMatch } from '../types';

// Environment variables
const YANDEX_FOLDER_ID = import.meta.env.VITE_YANDEX_FOLDER_ID || '';

// Use proxy endpoint instead of direct API call
const PROXY_ENDPOINT = '/api/yandex-search';

/**
 * Convert image file to Base64 string
 */
async function imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data URL prefix (data:image/jpeg;base64,)
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Search for similar images using Yandex Cloud Search API v2 via proxy
 */
export async function searchByImage(imageFile: File): Promise<YandexImageSearchResponse> {
    if (!YANDEX_FOLDER_ID) {
        throw new Error('Yandex Cloud Folder ID not configured. Please set VITE_YANDEX_FOLDER_ID in .env.local');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
        throw new Error('Invalid file format. Please use JPG, PNG, or WEBP');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB');
    }

    try {
        // Convert image to Base64
        const base64Image = await imageToBase64(imageFile);

        // Make request to proxy endpoint
        const response = await fetch(PROXY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                folderId: YANDEX_FOLDER_ID,
                data: base64Image,
                site: 'instagram.com', // Filter results to Instagram only
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data: YandexImageSearchResponse = await response.json();
        return data;
    } catch (error: any) {
        console.error('Error searching by image:', error);
        throw new Error(error.message || 'Failed to search by image');
    }
}

/**
 * Extract Instagram usernames from search results
 */
export function extractInstagramUsernames(results: YandexImageResult[]): InstagramMatch[] {
    const matches: InstagramMatch[] = [];
    const seenUsernames = new Set<string>();

    for (const result of results) {
        // Extract username from URL
        // Patterns: instagram.com/username/ or instagram.com/p/POST_ID/
        if (result.pageUrl) {
            const urlMatch = result.pageUrl.match(/instagram\.com\/([^\/\?]+)/);
            if (urlMatch && urlMatch[1]) {
                const username = urlMatch[1];

                // Skip common non-username paths
                if (['p', 'reel', 'tv', 'stories', 'explore', 'accounts'].includes(username)) {
                    continue;
                }

                if (!seenUsernames.has(username)) {
                    seenUsernames.add(username);
                    matches.push({
                        username,
                        profileUrl: `https://instagram.com/${username}`,
                        confidence: 90, // High confidence from URL
                        source: 'url',
                    });
                }
            }
        }

        // Extract username from page title
        // Pattern: "Username (@username) • Instagram photos and videos"
        if (result.pageTitle) {
            const titleMatch = result.pageTitle.match(/@([a-zA-Z0-9._]+)/);
            if (titleMatch && titleMatch[1]) {
                const username = titleMatch[1];
                if (!seenUsernames.has(username)) {
                    seenUsernames.add(username);
                    matches.push({
                        username,
                        profileUrl: `https://instagram.com/${username}`,
                        confidence: 85, // High confidence from title
                        source: 'title',
                    });
                }
            }
        }

        // Extract from description/passage
        if (result.passage) {
            const passageMatch = result.passage.match(/@([a-zA-Z0-9._]+)/);
            if (passageMatch && passageMatch[1]) {
                const username = passageMatch[1];
                if (!seenUsernames.has(username)) {
                    seenUsernames.add(username);
                    matches.push({
                        username,
                        profileUrl: `https://instagram.com/${username}`,
                        confidence: 70, // Lower confidence from description
                        source: 'description',
                    });
                }
            }
        }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
}
