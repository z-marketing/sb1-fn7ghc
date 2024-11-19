import { Handler } from '@netlify/functions';
import axios from 'axios';

// In-memory cache
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

  // Check cache
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_DURATION) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cache.data)
    };
  }

  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      params: {
        limit: 100,
        sort: 'market_cap',
        sort_dir: 'desc',
        convert: 'USD'
      },
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
      }
    });

    const coins = response.data.data.map((coin: any) => ({
      id: coin.slug,
      name: coin.name,
      symbol: coin.symbol
    }));

    // Add RichQuack at the beginning
    coins.unshift({
      id: 'richquack',
      name: 'RichQuack',
      symbol: 'QUACK'
    });

    // Update cache
    cache = {
      data: coins,
      timestamp: now
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(coins)
    };
  } catch (error: any) {
    console.error('Error fetching coins:', error.response?.data || error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch coins list',
        details: error.response?.data?.status?.error_message || error.message
      })
    };
  }
};

export { handler };