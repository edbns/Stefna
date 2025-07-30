import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface RealTimeDataOptions {
  endpoint: string;
  interval?: number;
  onUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useRealTimeData = <T>(options: RealTimeDataOptions) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const fetchData = async () => {
    if (!isActiveRef.current) return;
    
    try {
      const response = await fetch(options.endpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const newData = await response.json();
      
      if (isActiveRef.current) {
        setData(newData);
        setLastUpdated(new Date());
        setError(null);
        options.onUpdate?.(newData);
        
        if (!isLoading) {
          toast.success('Data updated', {
            duration: 2000,
            position: 'bottom-right',
            style: {
              background: '#2a4152',
              color: '#eee9dd',
              fontFamily: 'Figtree, sans-serif'
            }
          });
        }
      }
    } catch (err) {
      const error = err as Error;
      if (isActiveRef.current) {
        setError(error);
        options.onError?.(error);
        toast.error(`Update failed: ${error.message}`, {
          duration: 4000,
          position: 'bottom-right',
          style: {
            background: '#dc2626',
            color: '#fff',
            fontFamily: 'Figtree, sans-serif'
          }
        });
      }
    } finally {
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isActiveRef.current = true;
    fetchData();

    if (options.interval && options.interval > 0) {
      intervalRef.current = setInterval(fetchData, options.interval);
    }

    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [options.endpoint, options.interval]);

  const refresh = () => {
    setIsLoading(true);
    fetchData();
  };

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh
  };
};