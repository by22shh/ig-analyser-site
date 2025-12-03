// Netlify Function для проксирования запросов к Yandex Search API
const https = require('https');

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
        console.log('Request body:', event.body);

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

        // Подготавливаем данные для запроса
        const postData = JSON.stringify({
            folderId,
            data,
            site,
        });
        console.log('Post data prepared, size:', Buffer.byteLength(postData), 'bytes');

        // Делаем запрос к Yandex API через https
        const result = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'searchapi.yandex.net',
                port: 443,
                path: '/v2/image/search',
                method: 'POST',
                headers: {
                    'Authorization': `Api-Key ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                },
            };

            console.log('Making request to:', options.hostname + options.path);

            const req = https.request(options, (res) => {
                console.log('Response status:', res.statusCode);
                console.log('Response headers:', JSON.stringify(res.headers));

                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    console.log('Response received, length:', responseData.length);
                    console.log('Response preview:', responseData.substring(0, 200));

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsed = JSON.parse(responseData);
                            console.log('Successfully parsed JSON response');
                            resolve(parsed);
                        } catch (e) {
                            console.error('JSON parse error:', e.message);
                            reject(new Error('Invalid JSON response'));
                        }
                    } else {
                        console.error('API error response:', responseData);
                        reject(new Error(`Yandex API error: ${res.statusCode} - ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Request error:', error.message, error.code);
                reject(error);
            });

            console.log('Sending request...');
            req.write(postData);
            req.end();
        });

        console.log('Request successful, returning result');
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
