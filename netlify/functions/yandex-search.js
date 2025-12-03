// Netlify Function для проксирования запросов к Yandex Search API
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // Разрешаем CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        console.log('=== Yandex Search Proxy Started ===');
        console.log('Request body length:', event.body?.length);

        const { folderId, data, site } = JSON.parse(event.body);
        console.log('Parsed request - folderId:', folderId, 'site:', site, 'data length:', data?.length);

        // Получаем API ключ из переменных окружения
        const apiKey = process.env.YANDEX_API_KEY;
        console.log('API Key present:', !!apiKey, 'Length:', apiKey?.length);

        if (!apiKey) {
            console.error('API key not configured!');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' }),
            };
        }

        const requestBody = {
            folderId,
            data,
            site,
        };

        console.log('Making request to Yandex API...');

        // Делаем запрос к Yandex API
        const response = await fetch('https://searchapi.yandex.net/v2/image/search', {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(response.headers.raw()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: `Yandex API error: ${response.status}`,
                    details: errorText
                }),
            };
        }

        const result = await response.json();
        console.log('Successfully received response, images count:', result.images?.length || 0);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result),
        };

    } catch (error) {
        console.error('=== ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                type: error.constructor.name
            }),
        };
    }
};
