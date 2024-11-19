import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { CryptoData } from '../types/crypto';
import { fetchCryptoData } from '../services/api';

interface WidgetProps {
  coinId: string;
  theme?: 'light' | 'dark' | 'custom';
  accentColor?: string;
  backgroundColor?: string;
  padding?: number;
  responsive?: boolean;
}

const formatPrice = (price: number): string => {
  if (typeof price !== 'number') return '$0.00';

  // Handle very small numbers
  if (price < 0.00001) {
    const scientificNotation = price.toExponential(6);
    const [base, exponent] = scientificNotation.split('e-');
    return `$0.${'0'.repeat(Number(exponent) - 1)}${base.replace('.', '')}`;
  }

  // Handle small numbers (less than 1)
  if (price < 1) {
    const decimalPlaces = 8;
    return `$${price.toFixed(decimalPlaces)}`;
  }

  // Handle regular numbers
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const formatLargeNumber = (num: number): string => {
  if (typeof num !== 'number') return '$0';
  
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(3)}T`;
  }
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(3)}B`;
  }
  if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(3)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
};

export default function Widget({ 
  coinId, 
  theme = 'light',
  accentColor = '#4F46E5',
  backgroundColor = '#FFFFFF',
  padding = 16,
  responsive = false
}: WidgetProps) {
  const [data, setData] = useState<CryptoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const cryptoData = await fetchCryptoData(coinId);
        if (mounted) {
          setData(cryptoData);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [coinId]);

  const getThemeStyles = () => {
    if (theme === 'custom') {
      return {
        backgroundColor,
        color: '#000000',
        accentColor
      };
    }
    return theme === 'dark' 
      ? { backgroundColor: '#1F2937', color: '#FFFFFF', accentColor: '#60A5FA' }
      : { backgroundColor: '#FFFFFF', color: '#000000', accentColor: '#4F46E5' };
  };

  const themeStyles = getThemeStyles();

  if (loading) {
    return (
      <div 
        className="animate-pulse rounded-lg"
        style={{ 
          backgroundColor: themeStyles.backgroundColor,
          padding: `${padding}px`,
          width: responsive ? '100%' : 'auto'
        }}
      >
        <div className="h-16 bg-gray-300 rounded mb-4"></div>
        <div className="h-8 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div 
        className="rounded-lg flex items-center justify-center p-4 space-x-2"
        style={{ 
          backgroundColor: themeStyles.backgroundColor,
          color: themeStyles.color,
          padding: `${padding}px`,
          width: responsive ? '100%' : 'auto'
        }}
      >
        <AlertCircle size={20} className="text-red-500" />
        <p>{error || 'Failed to load data. Please try again later.'}</p>
      </div>
    );
  }

  const isPositive = data.price_change_percentage_24h > 0;

  return (
    <div 
      className="rounded-lg"
      style={{ 
        backgroundColor: themeStyles.backgroundColor,
        color: themeStyles.color,
        padding: `${padding}px`,
        width: responsive ? '100%' : 'auto'
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <img src={data.image} alt={data.name} className="w-8 h-8" />
          <div>
            <h2 className="font-bold">{data.name}</h2>
            <p className="text-sm opacity-70">{data.symbol.toUpperCase()}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold leading-none mb-1">
            {formatPrice(data.current_price)}
          </p>
          <div 
            className="flex items-center justify-end text-xs"
            style={{ color: isPositive ? '#10B981' : '#EF4444' }}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="ml-1">24h: {Math.abs(data.price_change_percentage_24h).toFixed(2)}%</span>
          </div>
        </div>

        <div>
          <p className="text-sm opacity-70">Market Cap</p>
          <p className="font-semibold">{formatLargeNumber(data.market_cap)}</p>
        </div>

        <div className="text-right">
          <p className="text-sm opacity-70">Volume 24h</p>
          <p className="font-semibold">{formatLargeNumber(data.total_volume)}</p>
        </div>
      </div>
    </div>
  );
}