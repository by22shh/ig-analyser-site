// Vercel Serverless Function для проксирования запросов к Yandex Search API
export default async function handler(req, res) {
    // Разрешаем CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { folderId, data, site } = req.body;

        // Получаем API ключ из переменных окружения
        const apiKey = process.env.YANDEX_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Делаем запрос к Yandex API
        const response = await fetch('https://searchapi.yandex.net/v2/image/search', {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                folderId,
                data,
                site,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: `Yandex API error: ${response.status}`,
                details: errorText
            });
        }

        const result = await response.json();
        return res.status(200).json(result);

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
