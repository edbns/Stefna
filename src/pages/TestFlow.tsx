import { useState } from 'react';
import { createAsset, processAsset, publishAsset } from '../lib/api';

export default function TestFlow() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('Starting test flow...');
      
      // Step 1: Create asset
      addResult('Creating test asset...');
      const createResult = await createAsset({
        sourcePublicId: 'test_source_image',
        mediaType: 'image',
        presetKey: 'test_preset',
        prompt: 'Test prompt for testing',
      });
      
      if (!createResult.ok) {
        addResult(`❌ Create failed: ${createResult.error}`);
        return;
      }
      
      const assetId = createResult.data.id;
      addResult(`✅ Asset created with ID: ${assetId}`);
      
      // Step 2: Process asset
      addResult('Processing asset...');
      const processResult = await processAsset({
        assetId,
        sourcePublicId: 'test_source_image',
        mediaType: 'image',
        presetKey: 'test_preset',
        prompt: 'Test prompt for testing',
      });
      
      if (!processResult.ok) {
        addResult(`❌ Process failed: ${processResult.error}`);
        return;
      }
      
      addResult(`✅ Asset processed successfully`);
      
      // Step 3: Publish asset
      addResult('Publishing asset...');
      const publishResult = await publishAsset({
        assetId,
        isPublic: true,
        allowRemix: true,
      });
      
      if (!publishResult.ok) {
        addResult(`❌ Publish failed: ${publishResult.error}`);
        return;
      }
      
      addResult(`✅ Asset published successfully!`);
      addResult('🎉 Test flow completed successfully!');
      
    } catch (error) {
      addResult(`❌ Test failed with error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Flow - Create → Process → Publish</h1>
      
      <div className="mb-6">
        <button
          onClick={runTest}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isRunning ? 'Running Test...' : 'Run Test Flow'}
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <div className="space-y-1 text-sm">
          {testResults.length === 0 ? (
            <div className="text-gray-500">No test results yet. Click "Run Test Flow" to start.</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="font-mono">{result}</div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">What This Test Does:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Creates a test asset in 'queued' status</li>
          <li>Processes it to 'ready' status with Cloudinary upload</li>
          <li>Publishes it to make it public</li>
          <li>Verifies the database trigger sets published_at</li>
        </ol>
      </div>
    </div>
  );
}
