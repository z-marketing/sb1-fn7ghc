import { Handler } from '@netlify/functions';
import axios from 'axios';

// In-memory cache
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 204, 
      headers, 
      body: '' 
    };
  }

  const { slug } = event.queryStringParameters || {};
  
  if (!slug) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing slug parameter' })
    };
  }

  // Check cache
  const now = Date.now();
  const cached = cache[slug];
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cached.data)
    };
  }

  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      params: {
        slug,
        convert: 'USD'
      },
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
      }
    });

    const data = response.data;
    if (!data.data || Object.keys(data.data).length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Coin not found' })
      };
    }

    const coinData = Object.values(data.data)[0] as any;
    const formattedData = {
      id: coinData.slug,
      symbol: coinData.symbol,
      name: coinData.name,
      image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coinData.id}.png`,
      current_price: coinData.quote.USD.price,
      market_cap: coinData.quote.USD.market_cap,
      total_volume: coinData.quote.USD.volume_24h,
      price_change_percentage_24h: coinData.quote.USD.percent_change_24h
    };

    // Update cache
    cache[slug] = {
      data: formattedData,
      timestamp: now
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedData)
    };
  } catch (error: any) {
    console.error('API Error:', error.response?.data || error);
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch crypto data',
        details: error.response?.data?.status?.error_message || error.message
      })
    };
  }
};

export { handler };