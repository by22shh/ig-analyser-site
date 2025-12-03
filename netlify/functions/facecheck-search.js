// Netlify Function для проксирования запросов к FaceCheck Face Search API
const fetch = require('node-fetch');
const FormData = require('form-data');

const SITE = 'https://facecheck.id';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // CORS preflight
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
        console.log('=== FaceCheck Proxy Started ===');
        console.log('Request body length:', event.body?.length);

        const { imageBase64 } = JSON.parse(event.body || '{}');

        if (!imageBase64) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'imageBase64 is required' }),
            };
        }

        const apiToken = process.env.FACECHECK_API_TOKEN;
        const testingMode = process.env.FACECHECK_TESTING_MODE === 'true';

        console.log('API token present:', !!apiToken);

        if (!apiToken) {
            console.error('FACECHECK_API_TOKEN is not configured');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'FaceCheck API token not configured' }),
            };
        }

        // 1) Upload image (multipart/form-data)
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        const formData = new FormData();
        formData.append('images', imageBuffer, {
            filename: 'upload.jpg',
            contentType: 'image/jpeg',
        });

        const uploadResponse = await fetch(`${SITE}/api/upload_pic`, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                Authorization: apiToken,
                ...formData.getHeaders(),
            },
            body: formData,
        });

        const uploadJson = await uploadResponse.json();
        console.log('Upload response:', uploadJson);

        if (uploadJson.error) {
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({
                    error: uploadJson.error,
                    code: uploadJson.code,
                    stage: 'upload',
                }),
            };
        }

        const idSearch = uploadJson.id_search;
        if (!idSearch) {
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({ error: 'FaceCheck did not return id_search' }),
            };
        }

        console.log('Uploaded, id_search:', idSearch);

        // 2) Poll search endpoint until results are ready
        const searchPayload = {
            id_search: idSearch,
            with_progress: true,
            status_only: false,
            demo: !!testingMode,
        };

        let attempts = 0;
        let searchJson = null;

        while (attempts < 30) { // максимум ~30 секунд ожидания
            const searchResponse = await fetch(`${SITE}/api/search`, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    Authorization: apiToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchPayload),
            });

            searchJson = await searchResponse.json();
            console.log('Search poll:', {
                attempt: attempts,
                message: searchJson.message,
                progress: searchJson.progress,
                hasOutput: !!searchJson.output,
            });

            if (searchJson.error) {
                return {
                    statusCode: 502,
                    headers,
                    body: JSON.stringify({
                        error: searchJson.error,
                        code: searchJson.code,
                        stage: 'search',
                    }),
                };
            }

            if (searchJson.output && searchJson.output.items) {
                break;
            }

            attempts += 1;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (!searchJson || !searchJson.output || !searchJson.output.items) {
            return {
                statusCode: 504,
                headers,
                body: JSON.stringify({ error: 'FaceCheck search timeout or empty results' }),
            };
        }

        // Нормализуем ответ для фронтенда
        const items = searchJson.output.items.map((item) => ({
            score: item.score,
            url: item.url,
            base64: item.base64,
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ items }),
        };
    } catch (error) {
        console.error('=== FaceCheck ERROR ===');
        console.error('Error type:', error.constructor?.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                type: error.constructor?.name,
            }),
        };
    }
};


