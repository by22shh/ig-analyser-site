import { FaceCheckSearchResponse, FaceCheckImageResult, InstagramMatch } from '../types';

// Proxy endpoint for FaceCheck Netlify Function
const PROXY_ENDPOINT = '/api/facecheck-search';

/**
 * Search for similar faces using FaceCheck API via proxy
 */
export async function searchByImage(imageFile: File): Promise<FaceCheckSearchResponse> {
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
        // Convert image to Base64 (without data URL prefix)
        const base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const base64Data = base64String.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });

        // Make request to proxy endpoint
        const response = await fetch(PROXY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageBase64: base64Image,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data: FaceCheckSearchResponse = await response.json();
        return data;
    } catch (error: any) {
        console.error('Error searching by image:', error);
        throw new Error(error.message || 'Failed to search by image');
    }
}

/**
 * Extract Instagram usernames from FaceCheck search results
 */
export function extractInstagramUsernames(results: FaceCheckImageResult[]): InstagramMatch[] {
    const matches: InstagramMatch[] = [];
    const seenUsernames = new Set<string>();

    for (const result of results) {
        // FaceCheck возвращает прямой URL страницы, где найдено фото
        // Ищем username в ссылках на instagram.com
        if (result.url) {
            const urlMatch = result.url.match(/instagram\.com\/([^\/\?]+)/);
            if (urlMatch && urlMatch[1]) {
                const username = urlMatch[1];

                if (['p', 'reel', 'tv', 'stories', 'explore', 'accounts'].includes(username)) {
                    continue;
                }

                if (!seenUsernames.has(username)) {
                    seenUsernames.add(username);
                    matches.push({
                        username,
                        profileUrl: `https://instagram.com/${username}`,
                        confidence: Math.round(result.score) || 80,
                        source: 'url',
                    });
                }
            }
        }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
}
