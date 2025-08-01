import React from 'react';
import { Zap, Clock, Gift } from 'lucide-react';
import { useQuota } from '../../hooks/useQuota';

const QuotaDisplay: React.FC = () => {
  const { quota, getRemainingTokens, getUsagePercentage, canUseToken } = useQuota();

  if (!quota) return null;

  const remaining = getRemainingTokens();
  const percentage = getUsagePercentage();
  const isLow = remaining <= 2;
  const isEmpty = !canUseToken();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className={`w-5 h-5 ${isEmpty ? 'text-gray-400' : isLow ? 'text-orange-500' : 'text-green-500'}`} />
          <span className="font-semibold text-gray-900">Daily AI Credits</span>
        </div>
        <div className="text-right">
          <div className={`font-bold text-lg ${isEmpty ? 'text-gray-400' : isLow ? 'text-orange-600' : 'text-green-600'}`}>
            {remaining}
          </div>
          <div className="text-xs text-gray-500">remaining</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isEmpty ? 'bg-gray-400' : isLow ? 'bg-orange-400' : 'bg-green-400'
          }`}
          style={{ width: `${Math.max(5, 100 - percentage)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Resets at midnight</span>
        </div>
        
        {quota.bonusTokens > 0 && (
          <div className="flex items-center space-x-1 text-purple-600">
            <Gift className="w-3 h-3" />
            <span>+{quota.bonusTokens} bonus</span>
          </div>
        )}
      </div>

      {isEmpty && (
        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-800 font-medium">
            Out of credits for today! 
          </p>
          <p className="text-xs text-orange-600 mt-1">
            Come back tomorrow or invite friends for bonus credits
          </p>
        </div>
      )}
    </div>
  );
};

export default QuotaDisplay;