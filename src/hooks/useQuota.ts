import { useState, useEffect } from 'react';
import { UserQuota } from '../types';
import { storage } from '../utils/storage';

export const useQuota = () => {
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuota();
  }, []);

  const loadQuota = () => {
    const userQuota = storage.getUserQuota();
    setQuota(userQuota);
    setLoading(false);
  };

  const useToken = () => {
    if (!quota) return false;
    
    const totalAvailable = quota.dailyLimit + quota.bonusTokens;
    if (quota.used >= totalAvailable) return false;

    const updatedQuota = {
      ...quota,
      used: quota.used + 1
    };
    
    storage.updateUserQuota(updatedQuota);
    setQuota(updatedQuota);
    return true;
  };

  const addBonusTokens = (amount: number) => {
    if (!quota) return;

    const updatedQuota = {
      ...quota,
      bonusTokens: quota.bonusTokens + amount
    };
    
    storage.updateUserQuota(updatedQuota);
    setQuota(updatedQuota);
  };

  const getRemainingTokens = () => {
    if (!quota) return 0;
    const totalAvailable = quota.dailyLimit + quota.bonusTokens;
    return Math.max(0, totalAvailable - quota.used);
  };

  const getUsagePercentage = () => {
    if (!quota) return 0;
    const totalAvailable = quota.dailyLimit + quota.bonusTokens;
    return Math.min(100, (quota.used / totalAvailable) * 100);
  };

  const canUseToken = () => {
    return getRemainingTokens() > 0;
  };

  return {
    quota,
    loading,
    useToken,
    addBonusTokens,
    getRemainingTokens,
    getUsagePercentage,
    canUseToken,
    reload: loadQuota
  };
};