// Validation Summary Component
// Shows validation results for the preset system (dev mode only)

import React, { useState, useEffect } from 'react';
import { validateAllSync } from '../utils/presets';

interface ValidationSummaryProps {
  showInProduction?: boolean;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  showInProduction = false 
}) => {
  const [validationResults, setValidationResults] = useState<{
    presetErrors: string[];
    optionErrors: string[];
    uiErrors: string[];
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Only show in development mode unless explicitly enabled
    if (!showInProduction && process.env.NODE_ENV === 'production') {
      return;
    }

    const results = validateAllSync();
    setValidationResults(results);
  }, [showInProduction]);

  // Don't render in production unless explicitly enabled
  if (!showInProduction && process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!validationResults) {
    return null;
  }

  const totalErrors = validationResults.presetErrors.length + 
                     validationResults.optionErrors.length + 
                     validationResults.uiErrors.length;

  if (totalErrors === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-600/90 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm border border-green-500/50">
        ✅ Preset system validated
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-600/90 text-white rounded-lg backdrop-blur-sm border border-red-500/50 max-w-md">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-red-500/20 transition-colors"
      >
        <span className="text-sm font-medium">
          ⚠️ {totalErrors} validation issue{totalErrors !== 1 ? 's' : ''}
        </span>
        <span className="text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="border-t border-red-500/50 p-3 max-h-64 overflow-y-auto">
          {validationResults.presetErrors.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-red-200 mb-1">
                Preset Errors ({validationResults.presetErrors.length})
              </h4>
              <ul className="text-xs space-y-1">
                {validationResults.presetErrors.map((error, index) => (
                  <li key={index} className="text-red-100">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResults.optionErrors.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-red-200 mb-1">
                Option Errors ({validationResults.optionErrors.length})
              </h4>
              <ul className="text-xs space-y-1">
                {validationResults.optionErrors.map((error, index) => (
                  <li key={index} className="text-red-100">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResults.uiErrors.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-red-200 mb-1">
                UI Configuration Errors ({validationResults.uiErrors.length})
              </h4>
              <ul className="text-xs space-y-1">
                {validationResults.uiErrors.map((error, index) => (
                  <li key={index} className="text-red-100">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-red-200 mt-2 pt-2 border-t border-red-500/30">
            Check console for detailed logs
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationSummary;
