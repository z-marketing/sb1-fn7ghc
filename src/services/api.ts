import axios from 'axios';
import type { CryptoData } from '../types/crypto';

const api = axios.create({
  baseURL: '/.netlify/functions',
  headers: {
    'Accept': 'application/json'
  }
});

export const fetchCryptoData = async (coinId: string): Promise<CryptoData> => {
  try {
    const { data } = await api.get(`/crypto-data`, {
      params: { slug: coinId }
    });
    
    if ('error' in data) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.error || error.message
      : error instanceof Error
        ? error.message
        : 'Failed to fetch crypto data';
    
    console.error('Widget Error:', { message: errorMessage });
    throw new Error(errorMessage);
  }
};