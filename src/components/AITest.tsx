import React, { useState } from 'react';
import { getAIResponse, getProviderStatus, resetFailedProviders } from '../services/AIService';
import { Bot, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AITest: React.FC = () => {
  const [testPrompt, setTestPrompt] = useState('Hello, can you tell me about social media trends?');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Record<string, { available: boolean; lastSuccess?: number }>>({});

  const testAI = async () => {
    setIsLoading(true);
    setResponse('');
    
    try {
      const result = await getAIResponse(testPrompt);
      setResponse(`Provider: ${result.provider}\nModel: ${result.model}\n\nResponse:\n${result.content}`);
      toast.success(`Success! Used ${result.provider}`);
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('AI test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = () => {
    setProviderStatus(getProviderStatus());
  };

  const resetProviders = () => {
    resetFailedProviders();
    updateStatus();
    toast.success('Provider status reset');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-6 h-6 text-black" />
        <h2 className="text-xl font-semibold text-black">AI Service Test</h2>
      </div>

      {/* Provider Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-medium text-black">Provider Status</h3>
          <button
            onClick={updateStatus}
            className="p-1 hover:bg-gray-100 rounded"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4 text-black" />
          </button>
          <button
            onClick={resetProviders}
            className="text-xs px-2 py-1 bg-black text-white rounded hover:bg-gray-800"
          >
            Reset Failed
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(providerStatus).map(([provider, status]) => (
            <div key={provider} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
              {status.available ? (
                <CheckCircle className="w-4 h-4 text-black" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium capitalize text-black">{provider}</span>
              {status.lastSuccess && (
                <span className="text-xs text-gray-500">
                  {new Date(status.lastSuccess).toLocaleTimeString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Test Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-2">
          Test Prompt
        </label>
        <textarea
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black"
          rows={3}
          placeholder="Enter a test prompt..."
        />
      </div>

      {/* Test Button */}
      <button
        onClick={testAI}
        disabled={isLoading || !testPrompt.trim()}
        className="w-full mb-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Testing AI...
          </>
        ) : (
          <>
            <Bot className="w-4 h-4" />
            Test AI Response
          </>
        )}
      </button>

      {/* Response */}
      {response && (
        <div className="mt-4">
          <h3 className="font-medium text-black mb-2">Response</h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <pre className="text-sm text-black whitespace-pre-wrap">{response}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITest; 