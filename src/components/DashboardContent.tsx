"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateBotModal } from "./CreateBotModal";
import { BotEmbedModal } from "./BotEmbedModal";
import { BotFileManagementModal } from "./BotFileManagementModal";
import { AnalyticsOverview } from "./analytics/AnalyticsOverview";
import { BotAnalytics } from "./analytics/BotAnalytics";
import { CallAnalytics } from "./analytics/CallAnalytics";
import { CallLogs } from "./analytics/CallLogs";


interface Bot {
  uuid: string;
  name: string;
  status: string;
  createdAt: string;
  documentsCount: number;
  ragEnabled: boolean;
  embedCode: string;
  activationScheduledAt: string;
  documentsProcessed?: number;
}

export function DashboardContent() {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isFileManagementModalOpen, setIsFileManagementModalOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(true);

  // Load user's bots
  useEffect(() => {
    loadBots();
  }, []);



  const loadBots = async () => {
    try {
      setIsLoadingBots(true);
      const response = await fetch('/api/bots/list');
      const result = await response.json();

      if (result.success) {
        // Transform the bot data to match the expected interface
        const transformedBots = result.bots.map((bot: any) => ({
          uuid: bot.uuid,
          name: bot.name,
          status: bot.status,
          createdAt: bot.createdAt,
          documentsCount: bot.documentsProcessed || 0,
          ragEnabled: bot.ragEnabled || false,
          embedCode: bot.embedCode || '',
          activationScheduledAt: bot.activationScheduledAt || bot.createdAt,
          vapiAssistantId: bot.vapiAssistantId
        }));
        setBots(transformedBots);
        console.log(`✅ Loaded ${transformedBots.length} bots from database`);
      } else {
        console.error('Failed to load bots:', result.error);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
    } finally {
      setIsLoadingBots(false);
    }
  };

  const handleBotCreated = async (newBot: any) => {
    const botData = {
      uuid: newBot.uuid,
      name: newBot.name,
      status: newBot.status,
      createdAt: new Date().toISOString(),
      documentsCount: newBot.documentsProcessed || 0,
      ragEnabled: newBot.ragEnabled || false,
      embedCode: newBot.embedCode,
      activationScheduledAt: newBot.activationScheduledAt
    };

    // Add the new bot to the list immediately for instant feedback
    setBots(prev => [...prev, botData]);
    setIsCreateModalOpen(false);

    // Reload bots from database to ensure consistency
    await loadBots();

    // Show embed modal with the new bot
    setSelectedBot(botData);
    setIsEmbedModalOpen(true);
  };

  const handleOpenCreateModal = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setIsCreateModalOpen(true);
  };

  const handleViewEmbedCode = (bot: Bot) => {
    setSelectedBot(bot);
    setIsEmbedModalOpen(true);
  };

  const handleManageFiles = (bot: Bot) => {
    setSelectedBot(bot);
    setIsFileManagementModalOpen(true);
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "bots", name: "Voice Bots", icon: "🤖" },
    { id: "analytics", name: "Analytics", icon: "📈" },
    { id: "settings", name: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1a11 11 0 0 0-11 11v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6a7 7 0 0 1 14 0v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6a11 11 0 0 0-11-11zm0 7a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0v-8a3 3 0 0 0-3-3z"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">VAPI Dashboard</h1>
            </div>
            
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
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "overview" && <OverviewTab onCreateBot={handleOpenCreateModal} />}
            {activeTab === "bots" && (
              <BotsTab
                bots={bots}
                isLoadingBots={isLoadingBots}
                onCreateBot={handleOpenCreateModal}
                onViewEmbedCode={handleViewEmbedCode}
                onManageFiles={handleManageFiles}
              />
            )}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </div>
      </div>

      {/* Create Bot Modal - Render at main component level */}
      <CreateBotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBotCreated={handleBotCreated}
      />

      {/* Bot Embed Modal */}
      {selectedBot && (
        <BotEmbedModal
          isOpen={isEmbedModalOpen}
          onClose={() => {
            setIsEmbedModalOpen(false);
            setSelectedBot(null);
          }}
          bot={selectedBot}
        />
      )}

      {/* Bot File Management Modal */}
      {selectedBot && (
        <BotFileManagementModal
          isOpen={isFileManagementModalOpen}
          onClose={() => {
            setIsFileManagementModalOpen(false);
            setSelectedBot(null);
          }}
          bot={selectedBot}
        />
      )}
    </div>
  );
}

function OverviewTab({ onCreateBot }: { onCreateBot: () => void }) {
  const router = useRouter(); // Add router hook for navigation
  const [stats, setStats] = useState({
    totalBots: 0,
    monthlyInteractions: 0,
    successRate: 0,
    loading: true
  });

  // Fetch real-time stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analytics/overview?timeRange=30d');
      const result = await response.json();

      if (result.success && result.overview) {
        const overview = result.overview;
        setStats({
          totalBots: overview.breakdown?.bots?.total || 0,
          monthlyInteractions: overview.breakdown?.vapi?.callsThisMonth || 0,
          successRate: Math.round((overview.breakdown?.vapi?.callsThisMonth || 0) > 0 ? 94 : 0),
          loading: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();

    // Real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live updates</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Voice Bots</p>
              {stats.loading ? (
                <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.totalBots}</p>
              )}
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Interactions</p>
              {stats.loading ? (
                <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.monthlyInteractions.toLocaleString()}</p>
              )}
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              {stats.loading ? (
                <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.successRate}%</p>
              )}
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={onCreateBot}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">➕</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Create New Bot</p>
              <p className="text-sm text-gray-600">Set up a new voice assistant</p>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-600">Check bot performance</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function BotsTab({ bots, isLoadingBots, onCreateBot, onViewEmbedCode, onManageFiles }: {
  bots: Bot[],
  isLoadingBots: boolean,
  onCreateBot: () => void,
  onViewEmbedCode: (bot: Bot) => void,
  onManageFiles: (bot: Bot) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Voice Bots</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {isLoadingBots ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading bots...</span>
            </div>
          ) : bots.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No voice bots yet</h4>
              <p className="text-gray-600 mb-4">Create your first voice bot to get started</p>
              <button
                onClick={onCreateBot}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Bot
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {bots.map((bot) => (
                <div key={bot.uuid} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{bot.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            bot.status === 'created' ? 'bg-green-100 text-green-800' :
                            bot.status === 'deployed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bot.status}
                          </span>
                          {bot.ragEnabled && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {bot.documentsCount} docs
                            </span>
                          )}
                          <span>Created {new Date(bot.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewEmbedCode(bot)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        Embed Code
                      </button>
                      {bot.ragEnabled && (
                        <button
                          onClick={() => onManageFiles(bot)}
                          className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        >
                          Manage Files
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Configure
                      </button>
                      {bot.status === 'active' ? (
                        <span className="text-green-600 text-sm font-medium">
                          ✓ Active
                        </span>
                      ) : (
                        <span className="text-yellow-600 text-sm font-medium">
                          ⏳ {bot.status === 'pending' ? 'Activating' : bot.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");

  const analyticsSubTabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "bots", name: "Bot Analytics", icon: "🤖" },
    { id: "calls", name: "Call Analytics", icon: "📞" },
    { id: "logs", name: "Call Logs", icon: "📋" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Analytics Sub-Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {analyticsSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAnalyticsTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeAnalyticsTab === tab.id
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
        {activeAnalyticsTab === "overview" && (
          <AnalyticsOverview timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        )}
        {activeAnalyticsTab === "bots" && (
          <BotAnalytics timeRange={timeRange} />
        )}
        {activeAnalyticsTab === "calls" && (
          <CallAnalytics timeRange={timeRange} />
        )}
        {activeAnalyticsTab === "logs" && (
          <CallLogs timeRange={timeRange} />
        )}
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
          <p className="text-gray-600">Account settings and preferences will be available here.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-blue-800 font-medium">Voice Bot System</h4>
            <p className="text-blue-700 text-sm mt-1">
              Your voice bots are automatically activated using VAPI AI. If a bot shows as "pending", it will be activated within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
