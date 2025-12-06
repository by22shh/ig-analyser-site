
import { InstagramProfile, StrategicReport } from "../types";
import { PROFILE_ANALYSIS_PROMPT, IMAGE_ANALYSIS_PROMPT, DEBT_COLLECTOR_PROMPT, HR_RECRUITMENT_PROMPT, INFLUENCER_AUDIT_PROMPT } from "../constants";

// --- CONFIGURATION ---

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = "https://zreti-app.netlify.app";
const SITE_NAME = "ZRETI Instagram Analyzer";

// MODEL CONFIGURATION
// Мы разделяем модели для оптимизации скорости и качества (Speed vs Intelligence)

// 1. VISION MODEL: 
// Используется для анализа изображений.
// Почему: Самая быстрая мультимодальная модель. Отлично считывает детали, но работает быстро, что критично для пачки из 10-12 фото.
const MODEL_VISION = "google/gemini-3-pro-preview";

// 2. REASONING MODEL: 
// Используется для составления ГЛАВНОГО ОТЧЕТА.
// Почему: Самый высокий IQ. Способна связать разрозненные факты в сложный психологический портрет.
const MODEL_REASONING = "google/gemini-3-pro-preview";

// 3. CHAT MODEL: 
// Используется для ЧАТА.
// Почему: Для чата важен умный контекст, а не скорость ответов робота. Используем ту же мощную модель, что и для отчета.
const MODEL_CHAT = "google/gemini-3-pro-preview";

// 4. DEEP RESEARCH MODEL:
// Используется для глубокого поиска информации.
const MODEL_DEEP_RESEARCH = "x-ai/grok-4.1-fast";

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
    temperature: number = 0.7,
    extraParams: Record<string, any> = {}
): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is missing in environment variables.");
    }

    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        const controller = new AbortController();
        // Тайм-ауты: 25 сек для картинок (они легкие), 90+ сек для большого отчета и умного чата
        const timeoutDuration = model === MODEL_VISION ? 25000 : 120000;
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
                    ...extraParams
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = JSON.stringify(errorData);

                // Check for insufficient credits/quota
                if (response.status === 402 || errorMessage.includes("credit") || errorMessage.includes("balance") || errorMessage.includes("quota")) {
                    throw new Error("ACCESS_DENIED_CREDITS");
                }

                throw new Error(`OpenRouter API Error: ${response.status} - ${errorMessage}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || "";

        } catch (err: any) {
            clearTimeout(timeoutId);
            console.warn(`Attempt ${i + 1} failed: ${err.message}`);
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

export type ProgressCallback = (current: number, total: number, stage: 'images' | 'final' | 'processing') => void;

export const analyzeProfileWithGemini = async (
    profileData: InstagramProfile,
    onProgress?: ProgressCallback,
    language: 'ru' | 'en' = 'ru',
    analysisType: 'standard' | 'debt' | 'hr' | 'influencer' = 'standard',
    targetPosition?: string
): Promise<StrategicReport> => {

    // 1. VISUAL INTELLIGENCE STAGE (BATCHED)
    // We analyze images in batches to reduce HTTP requests and speed up processing.
    // 100 posts -> ~20 requests instead of 100.
    const postsToAnalyze = profileData.posts.slice(0, 30); // Increased limit to 30
    const BATCH_SIZE = 5; // Send 5 images per single LLM request (Optimal for Gemini)

    const imageAnalysisResults: string[] = [];
    let processedCount = 0;

    if (onProgress) onProgress(0, postsToAnalyze.length, 'images');

    // Start Image Analysis in Background
    const imageAnalysisPromise = (async () => {
        for (let i = 0; i < postsToAnalyze.length; i += BATCH_SIZE) {
            const batch = postsToAnalyze.slice(i, i + BATCH_SIZE);

            // 1. Parallel Fetch of Base64 (Network Bound)
            const base64Promises = batch.map(async (post) => {
                if (!post.displayUrl) return null;
                const b64 = await fetchImageAsBase64(post.displayUrl);
                return b64 ? { id: post.id, data: b64 } : null;
            });

            const images = (await Promise.all(base64Promises)).filter(img => img !== null) as { id: string, data: string }[];

            if (images.length > 0) {
                // 2. Single LLM Request for the whole batch (AI Bound)
                await analyzeImageBatch(images, imageAnalysisResults);
            }

            processedCount += batch.length;
            if (onProgress) onProgress(Math.min(processedCount, postsToAnalyze.length), postsToAnalyze.length, 'images');
        }
    })();

    // 2. Prepare Text Context (Metadata) - Run immediately
    const metadataContext = profileData.posts.map(p => {
        return `
      POST ID: ${p.id}
      - URL: ${p.url || `https://www.instagram.com/p/${p.id}/`}
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

    const textContext = `
    PROFILE METADATA:
    Username: ${profileData.username}
    Full Name: ${profileData.fullName}
    Bio: ${profileData.biography}
    Followers: ${profileData.followersCount}
    Verified: ${profileData.isVerified}
    ${relatedContext}

    POSTS METADATA (Psychological Signals):
    ${metadataContext}
  `;

    // Wait for Image Analysis to finish before Final Report
    // We can't run the Final Report purely in parallel because it DEPENDS on the image insights.
    // However, we optimized by preparing text context while images were processing.

    await imageAnalysisPromise;

    // 3. FINAL STRATEGIC ANALYSIS STAGE
    if (onProgress) onProgress(0, 100, 'final');

    const combinedContext = `
    ${textContext}

    VISUAL INTELLIGENCE REPORT (Deep Image Analysis):
    ${imageAnalysisResults.length > 0 ? imageAnalysisResults.join("\n\n") : "Visual analysis unavailable."}
  `;

    const langInstruction = language === 'en'
        ? "\n\nIMPORTANT: OUTPUT THE FINAL REPORT STRICTLY IN ENGLISH. TRANSLATE ALL SECTIONS, TITLES, AND INSIGHTS TO ENGLISH."
        : "";

    let selectedPrompt = PROFILE_ANALYSIS_PROMPT;

    if (analysisType === 'debt') {
        selectedPrompt = DEBT_COLLECTOR_PROMPT;
    } else if (analysisType === 'hr') {
        selectedPrompt = HR_RECRUITMENT_PROMPT.replace('{{TARGET_POSITION}}', targetPosition || "General Position");
    } else if (analysisType === 'influencer') {
        selectedPrompt = INFLUENCER_AUDIT_PROMPT;
    }

    try {
        // Uses MODEL_REASONING for the big report
        const reportText = await openRouterCompletion([
            { role: "system", content: selectedPrompt + langInstruction },
            { role: "user", content: combinedContext }
        ], MODEL_REASONING, 0.5);

        // --- PARSING ---
        // --- PARSING ---
        const sections: { title: string; content: string }[] = [];

        // 1. Try parsing with strict [[SECTION]] marker
        const strictRegex = /(?:^|\n)\[\[SECTION\]\]\s*(\d+[\.\)]\s+[^:\n]+[:]?)([\s\S]*?)(?=\n\[\[SECTION\]\]|$)/g;

        // Check for Intro before the first section
        const firstMatch = strictRegex.exec(reportText);
        if (firstMatch && firstMatch.index > 0) {
            const introText = reportText.substring(0, firstMatch.index).trim();
            if (introText) {
                sections.push({ title: "Введение / Intro", content: introText });
            }
        }

        // Reset regex state
        strictRegex.lastIndex = 0;

        let match;
        while ((match = strictRegex.exec(reportText)) !== null) {
            sections.push({
                title: match[1].trim(),
                content: match[2].trim()
            });
        }

        // 2. Fallback: If no strict sections found, try loose parsing (old method)
        if (sections.length === 0) {
            const looseRegex = /(?:^|\n)(\d+[\.\)]\s+[^:\n]+[:]?)([\s\S]*?)(?=\n\d+[\.\)]\s+|$)/g;
            while ((match = looseRegex.exec(reportText)) !== null) {
                sections.push({
                    title: match[1].trim(),
                    content: match[2].trim()
                });
            }
        }

        if (sections.length === 0) {
            sections.push({ title: "Strategic Analysis", content: reportText });
        }

        // Filter out the OSINT PROMPT section from the display (it's internal for Deep Research)
        const filteredSections = sections.filter(s =>
            !s.title.toUpperCase().includes("OSINT PROMPT") &&
            !s.title.toUpperCase().includes("ГЕНЕРАЦИЯ ПОИСКОВОГО ЗАПРОСА")
        );

        return {
            rawText: reportText,
            sections: filteredSections,
            visionAnalysis: imageAnalysisResults,
            deepResearch: await performDeepResearch(reportText, onProgress)
        };

    } catch (error: any) {
        console.error("Critical Strategy Generation Error:", error);

        // Propagate credit errors directly to UI
        if (error.message === "ACCESS_DENIED_CREDITS") {
            throw error;
        }

        return {
            rawText: `Error: ${error.message}`,
            sections: [{ title: "SYSTEM ERROR", content: "Failed to generate report via OpenRouter. Please check logs." }],
            visionAnalysis: imageAnalysisResults
        };
    }
};

async function analyzeImageBatch(images: { id: string, data: string }[], resultsArray: string[]) {
    if (images.length === 0) return;

    try {
        const userContent: any[] = [
            { type: "text", text: `Analyze these ${images.length} images sequentially. IMPORTANT: For each image, START your response with the [Image ID: ...] tag provided before the image. Briefly describe key visual elements, hidden details, and vibe. Be concise.` }
        ];

        // Add images to the payload
        images.forEach(img => {
            userContent.push({ type: "text", text: `[Image ID: ${img.id}]` });
            userContent.push({ type: "image_url", image_url: { url: img.data } });
        });

        // Uses MODEL_VISION for speed and multimodal capability
        const description = await openRouterCompletion([
            { role: "system", content: IMAGE_ANALYSIS_PROMPT },
            { role: "user", content: userContent }
        ], MODEL_VISION, 0.4);

        if (description) {
            resultsArray.push(description);
        }
    } catch (err) {
        console.warn(`Failed to analyze image batch`, err);
    }
}

async function performDeepResearch(reportText: string, onProgress?: ProgressCallback): Promise<string | undefined> {
    try {
        // Extract the search prompt
        const match = /\[\[SEARCH_PROMPT_START\]\]([\s\S]*?)\[\[SEARCH_PROMPT_END\]\]/.exec(reportText);
        if (!match || !match[1].trim()) return undefined;

        const searchPrompt = match[1].trim();

        if (onProgress) onProgress(0, 100, 'processing'); // Update status to processing deep research

        // Call the Deep Research Model (Grok)
        const researchResult = await openRouterCompletion([
            {
                role: "system",
                content: "You are Grok, an advanced AI with Deep Research capabilities. Your goal is to find specific information based on the provided prompt. Use your internal knowledge and reasoning capabilities to simulate a deep web search.\n\nCRITICAL INSTRUCTIONS:\n1. LANGUAGE: The output MUST be in RUSSIAN.\n2. FORMAT: Use rich Markdown formatting for beautiful display on a website. Use headers (##, ###), bullet points, bold text for emphasis, and clear sections.\n3. CONTENT: Be direct, factual, and comprehensive. Structure the findings logically."
            },
            { role: "user", content: searchPrompt }
        ], MODEL_DEEP_RESEARCH, 0.4, { reasoning: { enabled: true } });

        return researchResult;

    } catch (error) {
        console.warn("Deep Research failed:", error);
        return undefined;
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

            // Chat responses using Pro model might take longer than Flash, but we want quality.
            const timeoutId = setTimeout(() => controller.abort(), 45000);

            try {
                // Uses MODEL_CHAT (Pro) for high intelligence interaction
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "HTTP-Referer": SITE_URL,
                        "X-Title": SITE_NAME,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: MODEL_CHAT,
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
