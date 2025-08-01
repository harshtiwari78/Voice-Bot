"use client";

import { useState } from "react";

interface BotEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: {
    uuid: string;
    name: string;
    status: string;
    embedCode: string;
    activationScheduledAt: string;
    documentsProcessed?: number;
    ragEnabled?: boolean;
  };
}

export function BotEmbedModal({ isOpen, onClose, bot }: BotEmbedModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) {
    return null;
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bot.embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'active':
        return 'Your bot is live and ready to use!';
      case 'activating':
        return 'Your bot is being activated...';
      case 'pending':
        return 'Your bot will be activated within 24 hours';
      case 'failed':
        return 'Bot activation failed. Please contact support.';
      default:
        return 'Unknown status';
    }
  };

  const formatActivationTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bot Created Successfully!</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Bot Info */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{bot.name}</h3>
              <div className="flex items-center space-x-4 text-sm">
                <span className={`px-3 py-1 rounded-full border ${getStatusColor(bot.status)}`}>
                  {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                </span>
                {bot.ragEnabled && (
                  <span className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {bot.documentsProcessed} docs
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="mb-6">
            <div className={`p-4 rounded-lg border ${getStatusColor(bot.status)}`}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <div>
                  <p className="font-medium text-gray-900">{getStatusMessage(bot.status)}</p>
                  {bot.status === 'pending' && (
                    <p className="text-sm mt-1 text-gray-700">
                      Scheduled activation: {formatActivationTime(bot.activationScheduledAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Embed Code</h3>
            <p className="text-sm text-gray-600 mb-3">
              Copy this code and paste it into your website's HTML. The bot will appear once activated.
            </p>
            
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{bot.embedCode}</code>
              </pre>
              <button
                onClick={copyToClipboard}
                className={`absolute top-2 right-2 px-3 py-1 rounded text-sm transition-colors ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Copy the embed code</p>
                  <p className="text-sm text-gray-600">Use the copy button above to copy the embed code to your clipboard.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add to your website</p>
                  <p className="text-sm text-gray-600">Paste the code before the closing &lt;/body&gt; tag in your HTML.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Wait for activation</p>
                  <p className="text-sm text-gray-600">
                    {bot.status === 'pending' 
                      ? 'Your bot will be activated within 24 hours. The widget will show as "pending" until then.'
                      : 'Your bot is ready to use!'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-blue-800 font-medium">Need Help?</h4>
                <p className="text-blue-700 text-sm mt-1">
                  If your bot doesn't activate within 24 hours or you need assistance, please contact our support team.
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
