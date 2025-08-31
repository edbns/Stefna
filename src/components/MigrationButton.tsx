import React, { useState } from 'react';
import { authenticatedFetch } from '../utils/apiClient';

export const MigrationButton: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>('');

  const runMigration = async () => {
    if (!confirm('This will set all existing users and media to private. Continue?')) {
      return;
    }

    setIsRunning(true);
    setResult('');

    try {
      const response = await authenticatedFetch('/.netlify/functions/migrate-privacy-first', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Migration completed successfully!\n\nVerification:\n${JSON.stringify(data.verification, null, 2)}`);
      } else {
        const error = await response.text();
        setResult(`❌ Migration failed: ${error}`);
      }
    } catch (error) {
      setResult(`❌ Migration error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4 border border-red-500 rounded-lg bg-red-50">
      <h3 className="text-lg font-bold text-red-700 mb-2">🔒 Privacy-First Migration</h3>
      <p className="text-sm text-red-600 mb-4">
        This will set all existing users and media to private by default.
      </p>
      
      <button
        onClick={runMigration}
        disabled={isRunning}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        {isRunning ? 'Running Migration...' : 'Run Migration'}
      </button>

      {result && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
          {result}
        </pre>
      )}
    </div>
  );
};
