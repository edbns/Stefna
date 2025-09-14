import { useState, useEffect } from 'react';

interface QuotaStatus {
  quota_enabled: boolean;
  quota_limit: number;
  current_count: number;
  quota_reached: boolean;
  remaining_slots: number;
}

export function useQuotaStatus() {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotaStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/.netlify/functions/check-quota');
        const data = await response.json();
        
        if (data.success && data.quota) {
          setQuotaStatus(data.quota);
        } else {
          setError('Failed to fetch quota status');
        }
      } catch (err) {
        setError('Network error');
        console.error('Error fetching quota status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotaStatus();
  }, []);

  return {
    quotaStatus,
    isLoading,
    error,
    quotaReached: quotaStatus?.quota_reached || false
  };
}
