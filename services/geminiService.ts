
import { InstagramProfile, StrategicReport } from "../types";
import { PROFILE_ANALYSIS_PROMPT, IMAGE_ANALYSIS_PROMPT } from "../constants";

// --- CONFIGURATION ---

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = "https://zreti-app.netlify.app";
const SITE_NAME = "ZRETI Instagram Analyzer";

// MODEL CONFIGURATION

const MODEL_VISION = "google/gemini-2.5-flash"; 
const MODEL_REASONING = "google/gemini-3-pro-preview"; 

// --- UTILS ---

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 секунд жесткий лимит на картинку

  try {
    // Используем wsrv.nl как надежный прокси для обхода 403 ошибок и ресайза
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg&w=800&q=80`; 
    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        if (res && res.startsWith('data:image')) {
            resolve(res);
        } else {
            resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn(`Failed to fetch image for analysis (${url}), skipping.`, e);
    return null;
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- OPENROUTER CLIENT ---

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: 'text' | 'image_url', text?: string, image_url?: { url: string } }>;
}

async function openRouterCompletion(
    messages: OpenRouterMessage[], 
    model: string,
    temperature: number = 0.7
): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is missing in environment variables.");
    }

    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        const controller = new AbortController();
        // Тайм-ауты: 25 сек для картинок (они легкие), 90 сек для большого отчета
        const timeoutDuration = model === MODEL_VISION ? 25000 : 90000; 
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": SITE_URL,
                    "X-Title": SITE_NAME,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: temperature,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenRouter API Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || "";

        } catch (err: any) {
            clearTimeout(timeoutId);
            console.warn(`Attempt ${i+1} failed: ${err.message}`);
            lastError = err;
            
            // Если это AbortError (тайм-аут), то это критично для UX, но мы попробуем еще раз
            if (err.name === 'AbortError') {
                console.warn("Request timed out - retrying...");
            }
            
            // Экспоненциальная задержка перед повтором
            if (i < maxRetries - 1) {
                 await delay(1000 * (i + 1)); 
            }
        }
    }

    throw lastError;
}

// --- ANALYSIS LOGIC ---

export type ProgressCallback = (current: number, total: number, stage: 'images' | 'final') => void;

export const analyzeProfileWithGemini = async (
  profileData: InstagramProfile,
  onProgress?: ProgressCallback
): Promise<StrategicReport> => {

  // 1. VISUAL INTELLIGENCE STAGE
  // Limit to 10 posts to avoid token limits and timeouts
  const postsToAnalyze = profileData.posts.slice(0, 10);
  let totalOperations = postsToAnalyze.length;
  // Estimate extra operations for carousels (checking 2nd slide)
  postsToAnalyze.forEach(p => { if(p.childPosts && p.childPosts.length > 1) totalOperations++; });

  const imageAnalysisResults: string[] = [];
  let completedOperations = 0;

  if (onProgress) onProgress(0, totalOperations, 'images');

  const BATCH_SIZE = 3; // Process 3 images in parallel
  
  for (let i = 0; i < postsToAnalyze.length; i += BATCH_SIZE) {
      const batch = postsToAnalyze.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (post) => {
          // Analyze Main Image
          if (post.displayUrl) {
             await analyzeSingleImage(post.displayUrl, post.id, "MAIN_IMAGE", imageAnalysisResults);
          }
          completedOperations++;
          if (onProgress) onProgress(completedOperations, totalOperations, 'images');

          // Analyze One Carousel Image (Context) if available
          if (post.childPosts && post.childPosts.length > 1) {
              // Take the 2nd image (index 1) usually hidden from main view
              const hiddenImageUrl = post.childPosts[1]; 
              if (hiddenImageUrl) {
                  await analyzeSingleImage(hiddenImageUrl, post.id, "CAROUSEL_SLIDE_2", imageAnalysisResults);
              }
              completedOperations++;
              if (onProgress) onProgress(completedOperations, totalOperations, 'images');
          }
      }));
  }

  // 2. STRATEGIC ANALYSIS STAGE
  if (onProgress) onProgress(totalOperations, totalOperations, 'final');

  // Enrich context with metadata
  const metadataContext = profileData.posts.map(p => {
      return `
      POST ID: ${p.id}
      - Date: ${p.timestamp}
      - Type: ${p.type} (${p.productType})
      - Pinned: ${p.isPinned ? "YES (High Importance)" : "No"}
      - Location: ${p.location ? `${p.location.name}` : "None"}
      - Music: ${p.musicInfo ? `${p.musicInfo.artist} - ${p.musicInfo.song}` : "None"}
      - Likes: ${p.likesCount}
      - Comments: ${p.commentsCount}
      - Caption: ${p.caption.substring(0, 200)}...
      `;
  }).join("\n");

  const relatedContext = profileData.relatedProfiles && profileData.relatedProfiles.length > 0 
      ? `RELATED ACCOUNTS (Potential Circle): ${profileData.relatedProfiles.map(p => p.username).join(", ")}` 
      : "";

  const combinedContext = `
    PROFILE METADATA:
    Username: ${profileData.username}
    Full Name: ${profileData.fullName}
    Bio: ${profileData.biography}
    Followers: ${profileData.followersCount}
    Verified: ${profileData.isVerified}
    ${relatedContext}

    POSTS METADATA (Psychological Signals):
    ${metadataContext}

    VISUAL INTELLIGENCE REPORT (Deep Image Analysis):
    ${imageAnalysisResults.length > 0 ? imageAnalysisResults.join("\n\n") : "Visual analysis unavailable."}
  `;

  try {
    const reportText = await openRouterCompletion([
        { role: "system", content: PROFILE_ANALYSIS_PROMPT },
        { role: "user", content: combinedContext }
    ], MODEL_REASONING, 0.5); 

    // --- PARSING ---
    const sections: { title: string; content: string }[] = [];
    const regex = /(?:^|\n)(\d+[\.\)]\s+[^:\n]+[:]?)([\s\S]*?)(?=\n\d+[\.\)]\s+|$)/g;
    let match;
    while ((match = regex.exec(reportText)) !== null) {
        sections.push({
            title: match[1].trim(),
            content: match[2].trim()
        });
    }

    if (sections.length === 0) {
        sections.push({ title: "Strategic Analysis", content: reportText });
    }

    return {
        rawText: reportText,
        sections,
        visionAnalysis: imageAnalysisResults 
    };

  } catch (error: any) {
    console.error("Critical Strategy Generation Error:", error);
    return {
        rawText: `Error: ${error.message}`,
        sections: [{ title: "SYSTEM ERROR", content: "Failed to generate report via OpenRouter. Please check logs." }],
        visionAnalysis: imageAnalysisResults
    };
  }
};

async function analyzeSingleImage(url: string, postId: string, label: string, resultsArray: string[]) {
    // If URL is clearly invalid, skip immediately
    if (!url || url.includes('null') || url.includes('undefined')) return;

    const base64 = await fetchImageAsBase64(url);
    if (!base64) return;

    try {
        const description = await openRouterCompletion([
            { role: "system", content: IMAGE_ANALYSIS_PROMPT },
            { 
                role: "user", 
                content: [
                    { type: "text", text: `Analyze this image (Post ${postId} - ${label}). Focus on hidden details.` },
                    { type: "image_url", image_url: { url: base64 } }
                ] 
            }
        ], MODEL_VISION, 0.2);

        if (description) {
            resultsArray.push(`[POST ${postId} - ${label}]:\n${description}`);
        }
    } catch (err) {
        console.warn(`Failed to analyze image ${postId}`, err);
    }
}

// --- CHAT FUNCTIONALITY ---

export interface ChatSession {
    sendMessageStream: (message: string) => AsyncGenerator<string, void, unknown>;
}

export const createChatSession = (
    profile: InstagramProfile,
    report: StrategicReport
): ChatSession => {
    const history: OpenRouterMessage[] = [
        { 
            role: "system", 
            content: `You are ZRETI AI, a strategic assistant. 
            Context: Analysis of Instagram profile @${profile.username}.
            
            REPORT SUMMARY:
            ${report.rawText.substring(0, 5000)} 
            
            Keep answers concise, professional, and practical.` 
        }
    ];

    return {
        sendMessageStream: async function* (userMessage: string) {
            if (!OPENROUTER_API_KEY) throw new Error("No API Key");

            history.push({ role: "user", content: userMessage });

            const controller = new AbortController();
            
            // Chat responses should be fast
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "HTTP-Referer": SITE_URL,
                        "X-Title": SITE_NAME,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: MODEL_REASONING, // Use the smart model for chat
                        messages: history,
                        stream: true
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (!response.body) throw new Error("No response body");

                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let buffer = "";
                let fullBotResponse = "";

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || ""; 

                        for (const line of lines) {
                            if (line.trim() === "") continue;
                            if (line.trim() === "data: [DONE]") continue;
                            
                            if (line.startsWith("data: ")) {
                                try {
                                    const json = JSON.parse(line.substring(6));
                                    const content = json.choices[0]?.delta?.content;
                                    if (content) {
                                        fullBotResponse += content;
                                        yield content;
                                    }
                                } catch (e) { }
                            }
                        }
                    }
                } finally {
                    if (fullBotResponse) {
                        history.push({ role: "assistant", content: fullBotResponse });
                    }
                    reader.releaseLock();
                }
            } catch (err) {
                clearTimeout(timeoutId);
                throw err;
            }
        }
    };
};
