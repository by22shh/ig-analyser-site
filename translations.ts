export type Language = 'ru' | 'en';

export const translations = {
  ru: {
    // App.tsx
    app_title_prefix: "ПОДРОБНЫЙ",
    app_title_gradient: "ИИ-АНАЛИЗ",
    app_title_suffix: "INSTAGRAM-ПРОФИЛЯ",
    app_description: "Система сканирует визуальные паттерны, скрытые метаданные и психологические маркеры для построения полного цифрового профиля личности.",
    input_label: "Target Identifier",
    input_placeholder: "@username",
    button_analyze: "Запустить Анализ",
    recent_searches: "Недавние проверки",
    error_fetch: "Ошибка сбора данных.",
    error_system: "Системная ошибка: Данные профиля отсутствуют.",
    error_analysis: "Ошибка анализа данных.",
    retry_analysis: "Повторить анализ (данные уже загружены)",
    
    // LoadingScreen
    stage_1: "Сбор Данных",
    stage_2: "Обработка Медиа",
    stage_3: "Глубокий Анализ",
    loading_connect: "Инициализация соединения... Поиск профиля...",
    loading_images: "Параллельный анализ: обработано {current} из {total} изображений",
    loading_final: "Синтез данных и формирование досье...",
    
    // AnalysisDashboard
    dossier_prefix: "ОТЧЕТ:",
    followers: "Подписчики",
    following: "Подписки",
    posts: "Посты",
    stat_likes: "Ср. Лайки",
    stat_comments: "Ср. Коммент.",
    stat_er: "Вовлеченность (ER)",
    stat_freq: "Частота постов",
    stat_sub_likes: "Последние {count} постов",
    stat_sub_interaction: "Взаимодействие",
    stat_sub_consistency: "Стабильность",
    stat_chart_title: "Матрица Активности",
    analyzed_count: "в анализе",
    er_high: "Высокий",
    er_avg: "Средний",
    er_tooltip: "Engagement Rate (ER) — это процент подписчиков, которые взаимодействуют с контентом (лайки + комментарии). Высокий ER > 3% означает живую и лояльную аудиторию.",
    
    // DigitalCircle
    circle_title: "Цифровой круг (Близкие связи)",
    badge_close: "Близкие",
    badge_tagged: "Отмечен",
    badge_active: "Активен",

    // DigitalFootprint
    footprint_title: "Цифровой след и контекст",
    fp_locations: "Недавние локации",
    fp_music: "Музыкальный вкус",
    fp_circle: "Связанный круг",
    fp_strategy: "Стратегия",
    pinned_detected: "Обнаружено {count} закрепленных постов.",
    high_priority: "Высокий приоритет для анализа.",

    // ChatWidget
    chat_intro: "Досье на @{username} загружено в память. Я готов ответить на вопросы по деталям фото, психотипу или помочь составить сообщение для контакта.",
    chat_placeholder: "Спроси о деталях или попроси совет...",
    chat_error: "Произошла ошибка связи с нейроядром (OpenRouter). Попробуйте еще раз.",
    chat_chips_1: "Как начать разговор?",
    chat_chips_2: "Оцени искренность",
    chat_chips_3: "Психологический портрет",
    chat_title: "AI Ассистент",
    
    // Buttons
    btn_copy: "КОПИРОВАТЬ",
    btn_pdf: "СКАЧАТЬ PDF",
    btn_new: "НОВЫЙ СКАН"
  },
  en: {
    // App.tsx
    app_title_prefix: "DETAILED",
    app_title_gradient: "AI-ANALYSIS",
    app_title_suffix: "OF INSTAGRAM PROFILE",
    app_description: "The system scans visual patterns, hidden metadata, and psychological markers to build a complete digital personality profile.",
    input_label: "Target Identifier",
    input_placeholder: "@username",
    button_analyze: "Start Analysis",
    recent_searches: "Recent Searches",
    error_fetch: "Data collection error.",
    error_system: "System error: Profile data missing.",
    error_analysis: "Data analysis error.",
    retry_analysis: "Retry Analysis (Data Loaded)",
    
    // LoadingScreen
    stage_1: "Data Collection",
    stage_2: "Media Processing",
    stage_3: "Deep Analysis",
    loading_connect: "Initializing connection... Searching profile...",
    loading_images: "Parallel analysis: processed {current} of {total} images",
    loading_final: "Data synthesis and dossier generation...",
    
    // AnalysisDashboard
    dossier_prefix: "REPORT:",
    followers: "Followers",
    following: "Following",
    posts: "Posts",
    stat_likes: "Avg. Likes",
    stat_comments: "Avg. Comments",
    stat_er: "Engagement Rate",
    stat_freq: "Post Frequency",
    stat_sub_likes: "Last {count} posts",
    stat_sub_interaction: "Interaction",
    stat_sub_consistency: "Consistency",
    stat_chart_title: "Activity Matrix",
    analyzed_count: "analyzed",
    er_high: "High",
    er_avg: "Avg",
    er_tooltip: "Engagement Rate (ER) is the percentage of followers engaging with content (likes + comments). High ER > 3% indicates an active and loyal audience.",
    
    // DigitalCircle
    circle_title: "Digital Circle (Close Connections)",
    badge_close: "Close",
    badge_tagged: "Tagged",
    badge_active: "Active",

    // DigitalFootprint
    footprint_title: "Digital Footprint & Context",
    fp_locations: "Recent Locations",
    fp_music: "Music Taste",
    fp_circle: "Related Circle",
    fp_strategy: "Strategy",
    pinned_detected: "{count} Pinned Post(s) detected.",
    high_priority: "High priority for analysis.",

    // ChatWidget
    chat_intro: "Dossier on @{username} loaded into memory. I am ready to answer questions about photo details, psychotype, or help draft a contact message.",
    chat_placeholder: "Ask about details or ask for advice...",
    chat_error: "Communication error with neural core (OpenRouter). Please try again.",
    chat_chips_1: "How to start a conversation?",
    chat_chips_2: "Rate sincerity",
    chat_chips_3: "Psychological profile",
    chat_title: "AI Assistant",
    
    // Buttons
    btn_copy: "COPY RAW",
    btn_pdf: "SAVE PDF",
    btn_new: "NEW SCAN"
  }
};

