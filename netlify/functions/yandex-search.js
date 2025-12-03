```javascript
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
    const { folderId, data, site } = JSON.parse(event.body);

    // Получаем API ключ из переменных окружения
    const apiKey = process.env.YANDEX_API_KEY;
    
    if (!apiKey) {
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

    // Делаем запрос к Yandex API через https
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'searchapi.yandex.net',
        path: '/v2/image/search',
        method: 'POST',
        headers: {
          'Authorization': `Api - Key ${ apiKey } `,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseData));
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`Yandex API error: ${ res.statusCode } - ${ responseData } `));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};
```
