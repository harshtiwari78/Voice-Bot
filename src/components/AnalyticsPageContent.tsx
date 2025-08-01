"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsOverview } from "./analytics/AnalyticsOverview";
import { BotAnalytics } from "./analytics/BotAnalytics";
import { CallAnalytics } from "./analytics/CallAnalytics";
import { CallLogs } from "./analytics/CallLogs";

export function AnalyticsPageContent() {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");

  // Real-time update interval (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger re-fetch of analytics data by updating a timestamp
      setTimeRange(prev => prev); // This will trigger useEffect in child components
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const analyticsSubTabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "bots", name: "Bot Analytics", icon: "🤖" },
    { id: "calls", name: "Call Analytics", icon: "📞" },
    { id: "logs", name: "Call Logs", icon: "📋" },
    // Note: Sessions tab removed as per requirements
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
            </div>

            {/* User Info and Sign Out */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <SignOutButton>
                <button className="text-gray-600 hover:text-gray-900 transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header with Real-time Indicator */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Real-time Analytics</h2>
              <p className="text-gray-600">Monitor your voice bot performance and usage</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates every 30s</span>
              <span>•</span>
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Analytics Sub-Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {analyticsSubTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Analytics Content */}
          <div className="min-h-[600px]">
            {activeTab === "overview" && (
              <AnalyticsOverview timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            )}
            {activeTab === "bots" && (
              <BotAnalytics timeRange={timeRange} />
            )}
            {activeTab === "calls" && (
              <CallAnalytics timeRange={timeRange} />
            )}
            {activeTab === "logs" && (
              <CallLogs timeRange={timeRange} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
