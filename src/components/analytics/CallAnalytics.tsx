"use client";

import { useState, useEffect } from 'react';

interface CallAnalyticsData {
  overview: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    successRate: string;
  };
  duration: {
    average: number;
    minimum: number;
    maximum: number;
    totalMinutes: number;
  };
  trends: {
    volumeTrends: Array<{
      date: string;
      count: number;
    }>;
  };
  byAssistant: Array<{
    assistantId: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgDuration: number;
  }>;
  recentCalls: Array<{
    id: string;
    assistantId: string;
    status: string;
    createdAt: string;
    startedAt: string;
    endedAt: string;
    duration: number | null;
    phoneNumber: string;
    type: string;
  }>;
}

interface CallAnalyticsProps {
  timeRange: string;
}

export function CallAnalytics({ timeRange }: CallAnalyticsProps) {
  const [data, setData] = useState<CallAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');

  useEffect(() => {
    fetchCallAnalytics();
  }, [timeRange, selectedAssistant]);

  const fetchCallAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ timeRange });
      if (selectedAssistant) {
        params.append('assistantId', selectedAssistant);
      }
      
      const response = await fetch(`/api/analytics/calls?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.analytics);
      } else {
        setError(result.error || 'Failed to load call analytics');
      }
    } catch (err) {
      setError('Failed to fetch call analytics');
      console.error('Call analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ended':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
      case 'ringing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Call Analytics</h3>
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
        <h3 className="text-xl font-semibold text-gray-900">Call Analytics</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchCallAnalytics}
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
        <h3 className="text-xl font-semibold text-gray-900">Call Analytics</h3>
        <select
          value={selectedAssistant}
          onChange={(e) => setSelectedAssistant(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Assistants</option>
          {data.byAssistant.map((assistant) => (
            <option key={assistant.assistantId} value={assistant.assistantId}>
              {assistant.assistantId.substring(0, 8)}... ({assistant.totalCalls} calls)
            </option>
          ))}
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{data.overview.totalCalls}</p>
            <p className="text-sm text-gray-600">Total Calls</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{data.overview.successfulCalls}</p>
            <p className="text-sm text-gray-600">Successful</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{data.overview.failedCalls}</p>
            <p className="text-sm text-gray-600">Failed</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{data.overview.successRate}%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </div>
        </div>
      </div>

      {/* Duration Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Call Duration Statistics</h4>
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
              <p className="text-xl font-bold text-gray-900">{data.duration.totalMinutes}m</p>
              <p className="text-sm text-gray-600">Total Minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call Volume Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Call Volume Trends</h4>
          {data.trends.volumeTrends.length > 0 ? (
            <div className="space-y-2">
              {data.trends.volumeTrends.slice(-7).map((trend) => (
                <div key={trend.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{new Date(trend.date).toLocaleDateString()}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (trend.count / Math.max(...data.trends.volumeTrends.map(t => t.count))) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{trend.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No call volume trends available</p>
          )}
        </div>
      </div>

      {/* Calls by Assistant */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Calls by Assistant</h4>
          {data.byAssistant.length > 0 ? (
            <div className="space-y-3">
              {data.byAssistant.slice(0, 5).map((assistant) => (
                <div key={assistant.assistantId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Assistant {assistant.assistantId.substring(0, 8)}...
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg Duration: {formatDuration(assistant.avgDuration)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{assistant.totalCalls} calls</p>
                    <p className="text-sm text-gray-600">
                      {assistant.successfulCalls} success, {assistant.failedCalls} failed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No assistant data available</p>
          )}
        </div>
      </div>

      {/* Recent Calls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Calls</h4>
          {data.recentCalls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Call ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recentCalls.map((call) => (
                    <tr key={call.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {call.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.duration ? formatDuration(call.duration) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(call.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent calls available</p>
          )}
        </div>
      </div>
    </div>
  );
}
