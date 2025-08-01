"use client";

import { useState, useEffect } from 'react';

interface SessionAnalyticsData {
  overview: {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    avgSessionsPerDay: number;
  };
  duration: {
    average: number;
    minimum: number;
    maximum: number;
    totalHours: number;
  };
  trends: {
    sessionTrends: Array<{
      date: string;
      count: number;
    }>;
    hourlyDistribution: Array<{
      hour: number;
      count: number;
    }>;
  };
  distributions: {
    geographic: Array<{
      country: string;
      count: number;
    }>;
    device: Array<{
      device: string;
      count: number;
    }>;
    browser: Array<{
      browser: string;
      count: number;
    }>;
  };
  byBot: Array<{
    botUuid: string;
    sessionCount: number;
    totalDuration: number;
    avgDuration: number;
  }>;
  recentSessions: Array<{
    id: string;
    botUuid: string;
    startTime: string;
    endTime: string;
    duration: number | null;
    userAgent: string;
    ipAddress: string;
    interactions: number;
    status: string;
  }>;
}

interface SessionAnalyticsProps {
  timeRange: string;
}

export function SessionAnalytics({ timeRange }: SessionAnalyticsProps) {
  const [data, setData] = useState<SessionAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBot, setSelectedBot] = useState<string>('');

  useEffect(() => {
    fetchSessionAnalytics();
  }, [timeRange, selectedBot]);

  const fetchSessionAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ timeRange });
      if (selectedBot) {
        params.append('botUuid', selectedBot);
      }
      
      const response = await fetch(`/api/analytics/sessions?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.analytics);
      } else {
        setError(result.error || 'Failed to load session analytics');
      }
    } catch (err) {
      setError('Failed to fetch session analytics');
      console.error('Session analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getHourLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Session Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
        <h3 className="text-xl font-semibold text-gray-900">Session Analytics</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchSessionAnalytics}
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
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Session Analytics</h3>
        <select
          value={selectedBot}
          onChange={(e) => setSelectedBot(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Bots</option>
          {data.byBot.map((bot) => (
            <option key={bot.botUuid} value={bot.botUuid}>
              {bot.botUuid.substring(0, 8)}... ({bot.sessionCount} sessions)
            </option>
          ))}
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{data.overview.totalSessions}</p>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{data.overview.activeSessions}</p>
            <p className="text-sm text-gray-600">Active Sessions</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{data.overview.completedSessions}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{data.overview.avgSessionsPerDay}</p>
            <p className="text-sm text-gray-600">Avg/Day</p>
          </div>
        </div>
      </div>

      {/* Duration Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Session Duration Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{formatDuration(data.duration.average)}</p>
              <p className="text-sm text-gray-600">Average Duration</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{formatDuration(data.duration.minimum)}</p>
              <p className="text-sm text-gray-600">Minimum Duration</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{formatDuration(data.duration.maximum)}</p>
              <p className="text-sm text-gray-600">Maximum Duration</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{data.duration.totalHours}h</p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Trends and Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Session Trends</h4>
            {data.trends.sessionTrends.length > 0 ? (
              <div className="space-y-2">
                {data.trends.sessionTrends.slice(-7).map((trend) => (
                  <div key={trend.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">{new Date(trend.date).toLocaleDateString()}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (trend.count / Math.max(...data.trends.sessionTrends.map(t => t.count))) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{trend.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No session trends available</p>
            )}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h4>
            {data.trends.hourlyDistribution.length > 0 ? (
              <div className="space-y-2">
                {data.trends.hourlyDistribution
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">{getHourLabel(hour.hour)}</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(hour.count / Math.max(...data.trends.hourlyDistribution.map(h => h.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{hour.count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hourly data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Geographic and Device Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h4>
            <div className="space-y-3">
              {data.distributions.geographic.map((geo) => (
                <div key={geo.country} className="flex items-center justify-between">
                  <span className="text-gray-600">{geo.country}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(geo.count / Math.max(...data.distributions.geographic.map(g => g.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{geo.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Device Distribution</h4>
            <div className="space-y-3">
              {data.distributions.device.map((device) => (
                <div key={device.device} className="flex items-center justify-between">
                  <span className="text-gray-600">{device.device}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(device.count / Math.max(...data.distributions.device.map(d => d.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{device.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Browser Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Browser Distribution</h4>
            <div className="space-y-3">
              {data.distributions.browser.map((browser) => (
                <div key={browser.browser} className="flex items-center justify-between">
                  <span className="text-gray-600">{browser.browser}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(browser.count / Math.max(...data.distributions.browser.map(b => b.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{browser.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions by Bot */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Sessions by Bot</h4>
          {data.byBot.length > 0 ? (
            <div className="space-y-3">
              {data.byBot.slice(0, 5).map((bot) => (
                <div key={bot.botUuid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Bot {bot.botUuid.substring(0, 8)}...</p>
                    <p className="text-sm text-gray-600">Avg Duration: {formatDuration(bot.avgDuration)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{bot.sessionCount} sessions</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(bot.totalDuration / 3600)}h total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No session data by bot available</p>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h4>
          {data.recentSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recentSessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {session.id.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.botUuid.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.duration ? formatDuration(session.duration) : 'Active'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.startTime).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent sessions available</p>
          )}
        </div>
      </div>
    </div>
  );
}
