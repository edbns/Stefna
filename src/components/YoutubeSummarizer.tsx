import React, { useState } from 'react';
import { PlayCircle, Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const YoutubeSummarizer: React.FC = () => {
  const { t } = useLanguage();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleSummarize = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch('/.netlify/functions/youtube-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary || 'No summary available');
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Failed to generate summary. Please try again.');
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const videoId = extractVideoId(youtubeUrl);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <PlayCircle className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">YouTube Summarizer</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Get AI-powered summaries of YouTube videos instantly. Simply paste a YouTube URL and get key insights, main points, and takeaways.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL
            </label>
            <div className="flex gap-3">
              <input
                id="youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setError('');
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSummarize}
                disabled={isLoading || !youtubeUrl.trim()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Summarize
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {thumbnailUrl && !error && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-24 h-18 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Video detected</p>
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  View on YouTube
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {summary && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">AI Summary</h2>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {summary}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Video</h3>
            <p className="text-gray-600">Our AI is processing the video content and generating a comprehensive summary...</p>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Paste any YouTube video URL</li>
          <li>• Our AI analyzes the video content and transcript</li>
          <li>• Get key points, main topics, and actionable insights</li>
          <li>• Copy and save summaries for future reference</li>
        </ul>
      </div>
    </div>
  );
};

export default YoutubeSummarizer;