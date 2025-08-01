"use client";

import { useState, useEffect } from 'react';

interface BotAnalyticsData {
  overview: {
    totalBots: number;
    activeBots: number;
    inactiveBots: number;
    ragEnabledBots: number;
    ragDisabledBots: number;
  };
  trends: {
    creationTrends: Array<{
      date: string;
      count: number;
    }>;
  };
  topBots: Array<{
    uuid: string;
    name: string;
    documentsProcessed: number;
    createdAt: string;
    status: string;
  }>;
  distributions: {
    voice: Array<{
      voice: string;
      count: number;
    }>;
    language: Array<{
      language: string;
      count: number;
    }>;
  };
  recentActivity: Array<{
    uuid: string;
    name: string;
    status: string;
    createdAt: string;
    ragEnabled: boolean;
    documentsProcessed: number;
  }>;
}

interface BotAnalyticsProps {
  timeRange: string;
}

export function BotAnalytics({ timeRange }: BotAnalyticsProps) {
  const [data, setData] = useState<BotAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBotAnalytics();
  }, [timeRange]);

  const fetchBotAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics/bots?timeRange=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setData(result.analytics);
      } else {
        setError(result.error || 'Failed to load bot analytics');
      }
    } catch (err) {
      setError('Failed to fetch bot analytics');
      console.error('Bot analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Bot Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Bot Analytics</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchBotAnalytics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Bot Analytics</h3>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{data.overview.totalBots}</p>
            <p className="text-sm text-gray-600">Total Bots</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{data.overview.activeBots}</p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">{data.overview.inactiveBots}</p>
            <p className="text-sm text-gray-600">Inactive</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{data.overview.ragEnabledBots}</p>
            <p className="text-sm text-gray-600">RAG Enabled</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{data.overview.ragDisabledBots}</p>
            <p className="text-sm text-gray-600">RAG Disabled</p>
          </div>
        </div>
      </div>

      {/* Creation Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Bot Creation Trends</h4>
          {data.trends.creationTrends.length > 0 ? (
            <div className="space-y-2">
              {data.trends.creationTrends.slice(-7).map((trend) => (
                <div key={trend.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{new Date(trend.date).toLocaleDateString()}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (trend.count / Math.max(...data.trends.creationTrends.map(t => t.count))) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{trend.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No creation trends available</p>
          )}
        </div>
      </div>

      {/* Top Performing Bots */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Bots</h4>
          {data.topBots.length > 0 ? (
            <div className="space-y-3">
              {data.topBots.slice(0, 5).map((bot, index) => (
                <div key={bot.uuid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{bot.name}</p>
                      <p className="text-sm text-gray-600">Created {new Date(bot.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{bot.documentsProcessed} docs</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      bot.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {bot.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No bot performance data available</p>
          )}
        </div>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Voice Distribution</h4>
            {data.distributions.voice.length > 0 ? (
              <div className="space-y-3">
                {data.distributions.voice.map((voice) => (
                  <div key={voice.voice} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{voice.voice}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(voice.count / Math.max(...data.distributions.voice.map(v => v.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{voice.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No voice data available</p>
            )}
          </div>
        </div>

        {/* Language Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h4>
            {data.distributions.language.length > 0 ? (
              <div className="space-y-3">
                {data.distributions.language.map((lang) => (
                  <div key={lang.language} className="flex items-center justify-between">
                    <span className="text-gray-600 uppercase">{lang.language}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(lang.count / Math.max(...data.distributions.language.map(l => l.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{lang.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No language data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Bot Activity</h4>
          {data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((bot) => (
                <div key={bot.uuid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{bot.name}</p>
                    <p className="text-sm text-gray-600">
                      Created {new Date(bot.createdAt).toLocaleDateString()} • {bot.documentsProcessed} documents
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {bot.ragEnabled && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">RAG</span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      bot.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {bot.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent bot activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
