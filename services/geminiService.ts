
import { GoogleGenAI, Chat } from "@google/genai";
import { InstagramProfile, StrategicReport, InstagramPost } from "../types";
import { PROFILE_ANALYSIS_PROMPT, IMAGE_ANALYSIS_PROMPT } from "../constants";

declare const process: any;

// Helper to fetch image via proxy and convert to base64
const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    // Using wsrv.nl as a reliable CORS proxy that returns images
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg&w=800`; 
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to fetch image for analysis", e);
    return null;
  }
};

export type ProgressCallback = (current: number, total: number, stage: 'images' | 'final') => void;

export const analyzeProfileWithGemini = async (
  profileData: InstagramProfile,
  onProgress?: ProgressCallback
): Promise<StrategicReport> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // ARCHITECTURE CHOICE:
  const visionModel = "gemini-2.5-flash";
  const reasoningModel = "gemini-3-pro-preview";

  // 1. VISUAL INTELLIGENCE STAGE
  const postsToAnalyze = profileData.posts.slice(0, 10);
  const imageAnalysisResults: string[] = [];

  if (onProgress) onProgress(0, postsToAnalyze.length, 'images');

  const processPost = async (post: InstagramPost) => {
    if (!post.displayUrl) return null;
    const base64 = await fetchImageAsBase64(post.displayUrl);
    if (!base64) return null;

    try {
        const imageResp = await ai.models.generateContent({
            model: visionModel,
            config: { systemInstruction: IMAGE_ANALYSIS_PROMPT },
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: "image/jpeg", data: base64 } },
                        { text: `Analyze this image from post: ${post.caption}` }
                    ]
                }
            ]
        });
        if (imageResp.text) {
            return `[ANALYSIS OF IMAGE ${post.id} posted at ${post.timestamp}]:\n${imageResp.text}`;
        }
    } catch (err) {
        console.warn(`Failed to analyze image ${post.id}`, err);
    }
    return null;
  };

  // Execution loop for batches
  const BATCH_SIZE = 3;
  for (let i = 0; i < postsToAnalyze.length; i += BATCH_SIZE) {
    const batch = postsToAnalyze.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(processPost));
    
    batchResults.forEach(res => {
        if (res) imageAnalysisResults.push(res);
    });

    if (onProgress) {
        const processedCount = Math.min(i + BATCH_SIZE, postsToAnalyze.length);
        onProgress(processedCount, postsToAnalyze.length, 'images');
    }
  }

  // 2. STRATEGIC ANALYSIS STAGE
  if (onProgress) onProgress(postsToAnalyze.length, postsToAnalyze.length, 'final');

  const combinedContext = `
    PROFILE DATA (JSON):
    ${JSON.stringify({
      ...profileData,
      posts: profileData.posts.slice(0, 10)
    }, null, 2)}

    VISUAL INTELLIGENCE REPORT (Deep analysis of top images):
    ${imageAnalysisResults.join("\n\n")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: reasoningModel,
      config: {
        systemInstruction: PROFILE_ANALYSIS_PROMPT,
        temperature: 0.4, 
      },
      contents: [{ role: "user", parts: [{ text: combinedContext }] }]
    });

    const text = response.text || "Analysis failed to generate text.";

    const sections: { title: string; content: string }[] = [];
    const rawSections = text.split(/^\d+\.\s+/gm);
    
    if (rawSections[0].trim() === "") rawSections.shift();

    const regex = /(\d+\.\s+[^:\n]+[:]?)([\s\S]*?)(?=\n\d+\.\s+|$)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        sections.push({
            title: match[1].trim(),
            content: match[2].trim()
        });
    }

    if (sections.length === 0) {
        sections.push({ title: "Strategic Report", content: text });
    }

    return {
        rawText: text,
        sections,
        visionAnalysis: imageAnalysisResults // Return this for the chat context
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to generate strategic report.");
  }
};

// --- CHAT FUNCTIONALITY ---

export const createChatSession = (
    profile: InstagramProfile,
    report: StrategicReport
): Chat => {
    const apiKey = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    // Construct a specialized system prompt for the chat
    const systemInstruction = `
        Ты — ZRETI AI, специализированный аналитик цифровых личностей.
        Твоя задача — отвечать на вопросы пользователя о конкретном Instagram-профиле (@${profile.username}), который мы только что проанализировали.

        У тебя есть доступ к трём уровням данных:
        1. Сырые данные профиля (цифры, даты, био).
        2. Детальный визуальный анализ 10 последних постов (описание одежды, окружения, предметов).
        3. Финальное стратегическое досье, которое уже сгенерировано.

        КОНТЕКСТ ПРОФИЛЯ (JSON):
        ${JSON.stringify({
            username: profile.username,
            fullName: profile.fullName,
            bio: profile.biography,
            followers: profile.followersCount,
            posts: profile.posts.slice(0, 10)
        })}

        ВИЗУАЛЬНЫЙ АНАЛИЗ (ГЛАЗА ИИ):
        ${report.visionAnalysis.join("\n\n")}

        СТРАТЕГИЧЕСКОЕ ДОСЬЕ (ВЫВОДЫ):
        ${report.rawText}

        ПРАВИЛА ОБЩЕНИЯ:
        - Отвечай кратко, по делу, в стиле киберпанк-аналитика или опытного профайлера.
        - Всегда ссылайся на факты. Если спрашивают "Почему ты решил, что он богат?", отвечай: "Потому что на фото 3 видны часы Rolex, а на фото 5 — салон Porsche".
        - Если пользователь просит написать сообщение для этого человека — используй стиль из раздела рекомендаций.
        - Ты говоришь на русском языке.
        - Не придумывай факты, которых нет в контексте.
    `;

    return ai.chats.create({
        model: "gemini-3-pro-preview", // Intelligent reasoning for chat
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7, // Slightly higher for conversational fluidity
        }
    });
};
