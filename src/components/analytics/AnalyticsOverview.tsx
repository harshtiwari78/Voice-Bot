"use client";

import { useState, useEffect } from 'react';

interface QuickStat {
  title: string;
  value: number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

interface OverviewData {
  quickStats: QuickStat[];
  systemHealth: {
    botsOnline: number;
    activeSessions: number;
    apiStatus: string;
    fileStorageStatus: string;
    lastUpdated: string;
  };
  breakdown: {
    bots: {
      total: number;
      active: number;
      inactive: number;
      ragEnabled: number;
      ragDisabled: number;
    };
    sessions: {
      total: number;
      active: number;
      completed: number;
    };
    vapi: {
      callsToday: number;
      callsThisWeek: number;
      callsThisMonth: number;
    };
    storage: {
      totalFiles: number;
      totalSizeMB: number;
      botsWithFiles: number;
    };
  };
  recentActivity: {
    bots: Array<{
      uuid: string;
      name: string;
      status: string;
      createdAt: string;
      ragEnabled: boolean;
    }>;
    sessions: Array<{
      id: string;
      botUuid: string;
      startTime: string;
      status: string;
    }>;
  };
}

interface AnalyticsOverviewProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export function AnalyticsOverview({ timeRange, onTimeRangeChange }: AnalyticsOverviewProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverviewData();
  }, [timeRange]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics/overview?timeRange=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setData(result.overview);
      } else {
        setError(result.error || 'Failed to load analytics data');
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics overview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'not_configured':
      case 'empty':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded-lg"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">❌</span>
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Analytics</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
          <button 
            onClick={fetchOverviewData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.quickStats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                <div className={`flex items-center text-sm ${getTrendColor(stat.trend)}`}>
                  <span className="mr-1">{getTrendIcon(stat.trend)}</span>
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Bots Online</span>
              <span className="font-semibold text-gray-900">{data.systemHealth.botsOnline}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="font-semibold text-gray-900">{data.systemHealth.activeSessions}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">VAPI Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(data.systemHealth.apiStatus)}`}>
                {data.systemHealth.apiStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">File Storage</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(data.systemHealth.fileStorageStatus)}`}>
                {data.systemHealth.fileStorageStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bots Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bots Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bots</span>
                <span className="font-semibold">{data.breakdown.bots.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active</span>
                <span className="font-semibold text-green-600">{data.breakdown.bots.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inactive</span>
                <span className="font-semibold text-gray-500">{data.breakdown.bots.inactive}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">RAG Enabled</span>
                <span className="font-semibold text-blue-600">{data.breakdown.bots.ragEnabled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* VAPI Calls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">VAPI Calls</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Today</span>
                <span className="font-semibold">{data.breakdown.vapi.callsToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold">{data.breakdown.vapi.callsThisWeek}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">{data.breakdown.vapi.callsThisMonth}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bots */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bots</h3>
            <div className="space-y-3">
              {data.recentActivity.bots.length > 0 ? (
                data.recentActivity.bots.map((bot) => (
                  <div key={bot.uuid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{bot.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(bot.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {bot.ragEnabled && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">RAG</span>}
                      <span className={`text-xs px-2 py-1 rounded ${
                        bot.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bot.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent bots</p>
              )}
            </div>
          </div>
        </div>

        {/* File Storage */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">File Storage</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Files</span>
                <span className="font-semibold">{data.breakdown.storage.totalFiles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Storage Used</span>
                <span className="font-semibold">{data.breakdown.storage.totalSizeMB.toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bots with Files</span>
                <span className="font-semibold">{data.breakdown.storage.botsWithFiles}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
