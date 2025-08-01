"use client";

import { useState, useEffect } from "react";

interface AdminBot {
  uuid: string;
  name: string;
  status: string;
  createdAt: string;
  activationScheduledAt: string;
  activatedAt?: string;
  documentsProcessed: number;
  ragEnabled: boolean;
}

export function AdminPanel() {
  const [bots, setBots] = useState<AdminBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingBots, setProcessingBots] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/activate-bot');
      const result = await response.json();

      if (result.success) {
        setBots(result.bots);
      } else {
        console.error('Failed to load bots:', result.error);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateBot = async (botUuid: string) => {
    try {
      setProcessingBots(prev => new Set(prev).add(botUuid));
      
      const response = await fetch('/api/admin/activate-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          botUuid,
          action: 'activate'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update bot status locally
        setBots(prev => prev.map(bot => 
          bot.uuid === botUuid 
            ? { ...bot, status: 'activating' }
            : bot
        ));

        // Refresh after a delay to get the final status
        setTimeout(() => {
          loadBots();
        }, 4000);
      } else {
        console.error('Failed to activate bot:', result.error);
        alert('Failed to activate bot: ' + result.error);
      }
    } catch (error) {
      console.error('Error activating bot:', error);
      alert('Error activating bot');
    } finally {
      setProcessingBots(prev => {
        const newSet = new Set(prev);
        newSet.delete(botUuid);
        return newSet;
      });
    }
  };

  const handleDeactivateBot = async (botUuid: string) => {
    try {
      setProcessingBots(prev => new Set(prev).add(botUuid));
      
      const response = await fetch('/api/admin/activate-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          botUuid,
          action: 'deactivate'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update bot status locally
        setBots(prev => prev.map(bot => 
          bot.uuid === botUuid 
            ? { ...bot, status: 'pending' }
            : bot
        ));
      } else {
        console.error('Failed to deactivate bot:', result.error);
        alert('Failed to deactivate bot: ' + result.error);
      }
    } catch (error) {
      console.error('Error deactivating bot:', error);
      alert('Error deactivating bot');
    } finally {
      setProcessingBots(prev => {
        const newSet = new Set(prev);
        newSet.delete(botUuid);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'activating':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Bot Activation Management</h3>
        <button
          onClick={loadBots}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {bots.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No bots found</p>
          ) : (
            <div className="space-y-4">
              {bots.map((bot) => (
                <div key={bot.uuid} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{bot.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className={`px-2 py-1 rounded-full border text-xs ${getStatusColor(bot.status)}`}>
                          {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                        </span>
                        {bot.ragEnabled && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {bot.documentsProcessed} docs
                          </span>
                        )}
                        <span>Created: {formatDate(bot.createdAt)}</span>
                        {bot.activatedAt && (
                          <span>Activated: {formatDate(bot.activatedAt)}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        UUID: {bot.uuid}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {bot.status === 'pending' && (
                        <button
                          onClick={() => handleActivateBot(bot.uuid)}
                          disabled={processingBots.has(bot.uuid)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {processingBots.has(bot.uuid) ? 'Activating...' : 'Activate Now'}
                        </button>
                      )}
                      
                      {bot.status === 'active' && (
                        <button
                          onClick={() => handleDeactivateBot(bot.uuid)}
                          disabled={processingBots.has(bot.uuid)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {processingBots.has(bot.uuid) ? 'Processing...' : 'Deactivate'}
                        </button>
                      )}
                      
                      {bot.status === 'activating' && (
                        <span className="text-blue-600 text-sm">
                          🔄 Processing...
                        </span>
                      )}
                      
                      {bot.status === 'failed' && (
                        <button
                          onClick={() => handleActivateBot(bot.uuid)}
                          disabled={processingBots.has(bot.uuid)}
                          className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                        >
                          Retry Activation
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-blue-800 font-medium">Manual Activation</h4>
            <p className="text-blue-700 text-sm mt-1">
              Use this panel to manually activate bots that are pending. Normally, bots are activated automatically within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
