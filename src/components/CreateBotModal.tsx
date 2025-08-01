"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBotCreated: (bot: any) => void;
}

interface BotConfig {
  botName: string;
  welcomeMessage: string;
  systemPrompt: string;
  language: string;
  voice: string;
  position: 'left' | 'right';
  theme: 'light' | 'dark';
  ragEnabled: boolean;
  ragSourceType: 'files' | 'url';
  ragUrl: string;
  ragFiles: File[];
}

const SAMPLE_PROMPTS = {
  basic: 'You are a helpful voice assistant. You provide concise, accurate information to users in a friendly manner.',
  'customer-service': 'You are a customer service voice assistant. Your goal is to help users with their questions about products, services, and troubleshooting. Be empathetic and solution-oriented.',
  navigation: 'You are a helpful voice assistant with website navigation capabilities. When users ask you to "open", "go to", or "navigate to" a website (e.g., "open google.com"), you will help them visit that website. You can also answer general questions and provide information.',
  'product-expert': 'You are a product expert voice assistant. You provide detailed information about our products, features, pricing, and can help users choose the right option for their needs.',
  'sales-assistant': 'You are a sales assistant that helps customers understand our products and services. You can answer questions about pricing, features, and help guide customers to make informed decisions.',
  'support-agent': 'You are a technical support agent. You help users troubleshoot issues, provide step-by-step guidance, and escalate complex problems when necessary.'
};

const VOICE_OPTIONS = [
  { value: 'jennifer', label: 'Jennifer (Female, Professional)' },
  { value: 'mark', label: 'Mark (Male, Friendly)' },
  { value: 'sarah', label: 'Sarah (Female, Warm)' },
  { value: 'david', label: 'David (Male, Authoritative)' },
  { value: 'emma', label: 'Emma (Female, Energetic)' },
  { value: 'alex', label: 'Alex (Neutral, Clear)' }
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' }
];

export function CreateBotModal({ isOpen, onClose, onBotCreated }: CreateBotModalProps) {
  const { user } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [config, setConfig] = useState<BotConfig>({
    botName: '',
    welcomeMessage: '',
    systemPrompt: '',
    language: 'en',
    voice: 'jennifer',
    position: 'right',
    theme: 'light',
    ragEnabled: false,
    ragSourceType: 'files',
    ragUrl: '',
    ragFiles: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) {
    return null;
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!config.botName.trim()) newErrors.botName = 'Bot name is required';
      if (!config.welcomeMessage.trim()) newErrors.welcomeMessage = 'Welcome message is required';
      if (!config.systemPrompt.trim()) newErrors.systemPrompt = 'System prompt is required';
    }

    if (step === 3 && config.ragEnabled) {
      if (config.ragSourceType === 'url' && !config.ragUrl.trim()) {
        newErrors.ragUrl = 'RAG URL is required when URL source is selected';
      }
      if (config.ragSourceType === 'files' && config.ragFiles.length === 0) {
        newErrors.ragFiles = 'At least one file is required when file source is selected';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setConfig(prev => ({ ...prev, ragFiles: files }));
  };

  const handleCreateBot = async () => {
    if (!validateStep(currentStep)) return;

    setIsCreating(true);
    try {
      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('config', JSON.stringify({
        ...config,
        userId: user?.id
      }));

      // Add files if any
      config.ragFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const response = await fetch('/api/bots/create', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create bot');
      }

      onBotCreated(result.bot);
      onClose();
      
      // Reset form
      setConfig({
        botName: '',
        welcomeMessage: '',
        systemPrompt: '',
        language: 'en',
        voice: 'jennifer',
        position: 'right',
        theme: 'light',
        ragEnabled: false,
        ragSourceType: 'files',
        ragUrl: '',
        ragFiles: []
      });
      setCurrentStep(1);

    } catch (error) {
      console.error('Error creating bot:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to create bot' });
    } finally {
      setIsCreating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bot Name *
        </label>
        <input
          type="text"
          value={config.botName}
          onChange={(e) => setConfig(prev => ({ ...prev, botName: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
            errors.botName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Customer Support Bot"
        />
        {errors.botName && <p className="text-red-500 text-sm mt-1">{errors.botName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Welcome Message *
        </label>
        <textarea
          value={config.welcomeMessage}
          onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
            errors.welcomeMessage ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={3}
          placeholder="Hello! I'm your voice assistant. How can I help you today?"
        />
        {errors.welcomeMessage && <p className="text-red-500 text-sm mt-1">{errors.welcomeMessage}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Prompt Template
        </label>
        <select
          onChange={(e) => {
            if (e.target.value && SAMPLE_PROMPTS[e.target.value as keyof typeof SAMPLE_PROMPTS]) {
              setConfig(prev => ({
                ...prev,
                systemPrompt: SAMPLE_PROMPTS[e.target.value as keyof typeof SAMPLE_PROMPTS]
              }));
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
        >
          <option value="">Choose a template...</option>
          <option value="basic">Basic Assistant</option>
          <option value="customer-service">Customer Service</option>
          <option value="navigation">Navigation Assistant</option>
          <option value="product-expert">Product Expert</option>
          <option value="sales-assistant">Sales Assistant</option>
          <option value="support-agent">Support Agent</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Prompt *
        </label>
        <textarea
          value={config.systemPrompt}
          onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
            errors.systemPrompt ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={4}
          placeholder="Define how your bot should behave and respond to users..."
        />
        {errors.systemPrompt && <p className="text-red-500 text-sm mt-1">{errors.systemPrompt}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={config.language}
            onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            {LANGUAGE_OPTIONS.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice
          </label>
          <select
            value={config.voice}
            onChange={(e) => setConfig(prev => ({ ...prev, voice: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            {VOICE_OPTIONS.map(voice => (
              <option key={voice.value} value={voice.value}>{voice.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Position
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center text-gray-700">
            <input
              type="radio"
              name="position"
              value="right"
              checked={config.position === 'right'}
              onChange={(e) => setConfig(prev => ({ ...prev, position: e.target.value as 'left' | 'right' }))}
              className="mr-2"
            />
            Right Side
          </label>
          <label className="flex items-center text-gray-700">
            <input
              type="radio"
              name="position"
              value="left"
              checked={config.position === 'left'}
              onChange={(e) => setConfig(prev => ({ ...prev, position: e.target.value as 'left' | 'right' }))}
              className="mr-2"
            />
            Left Side
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Theme
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center text-gray-700">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={config.theme === 'light'}
              onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
              className="mr-2"
            />
            Light Theme
          </label>
          <label className="flex items-center text-gray-700">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={config.theme === 'dark'}
              onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
              className="mr-2"
            />
            Dark Theme
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Knowledge Base Enhancement</h4>
        <p className="text-blue-700 text-sm">
          Add documents or websites to give your bot specific knowledge about your business, products, or services.
        </p>
      </div>

      <div>
        <label className="flex items-center space-x-3 text-gray-700">
          <input
            type="checkbox"
            checked={config.ragEnabled}
            onChange={(e) => setConfig(prev => ({ ...prev, ragEnabled: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Enable Knowledge Base (RAG)
          </span>
        </label>
      </div>

      {config.ragEnabled && (
        <div className="space-y-4 pl-7">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Knowledge Source
            </label>
            <div className="space-y-2">
              <label className="flex items-center text-gray-700">
                <input
                  type="radio"
                  name="ragSourceType"
                  value="files"
                  checked={config.ragSourceType === 'files'}
                  onChange={(e) => setConfig(prev => ({ ...prev, ragSourceType: e.target.value as 'files' | 'url' }))}
                  className="mr-2"
                />
                Upload Documents (PDF, TXT, DOCX)
              </label>
              <label className="flex items-center text-gray-700">
                <input
                  type="radio"
                  name="ragSourceType"
                  value="url"
                  checked={config.ragSourceType === 'url'}
                  onChange={(e) => setConfig(prev => ({ ...prev, ragSourceType: e.target.value as 'files' | 'url' }))}
                  className="mr-2"
                />
                Website URL
              </label>
            </div>
          </div>

          {config.ragSourceType === 'files' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Documents
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.docx,.doc"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
              {config.ragFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Selected files:</p>
                  <ul className="text-sm text-gray-500">
                    {config.ragFiles.map((file, index) => (
                      <li key={index}>• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
              {errors.ragFiles && <p className="text-red-500 text-sm mt-1">{errors.ragFiles}</p>}
            </div>
          )}

          {config.ragSourceType === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={config.ragUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, ragUrl: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                  errors.ragUrl ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com"
              />
              {errors.ragUrl && <p className="text-red-500 text-sm mt-1">{errors.ragUrl}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Review Your Bot Configuration</h4>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Bot Name:</span>
            <p className="text-gray-600">{config.botName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Language:</span>
            <p className="text-gray-600">{LANGUAGE_OPTIONS.find(l => l.value === config.language)?.label}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Voice:</span>
            <p className="text-gray-600">{VOICE_OPTIONS.find(v => v.value === config.voice)?.label}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Position:</span>
            <p className="text-gray-600">{config.position === 'right' ? 'Right Side' : 'Left Side'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Theme:</span>
            <p className="text-gray-600">{config.theme === 'light' ? 'Light Theme' : 'Dark Theme'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Knowledge Base:</span>
            <p className="text-gray-600">{config.ragEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>

        <div className="mt-4">
          <span className="font-medium text-gray-700">Welcome Message:</span>
          <p className="text-gray-600 text-sm mt-1">{config.welcomeMessage}</p>
        </div>

        <div className="mt-4">
          <span className="font-medium text-gray-700">System Prompt:</span>
          <p className="text-gray-600 text-sm mt-1">{config.systemPrompt}</p>
        </div>

        {config.ragEnabled && (
          <div className="mt-4">
            <span className="font-medium text-gray-700">Knowledge Source:</span>
            <p className="text-gray-600 text-sm mt-1">
              {config.ragSourceType === 'files'
                ? `${config.ragFiles.length} file(s) uploaded`
                : `Website: ${config.ragUrl}`
              }
            </p>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-yellow-800 font-medium">Ready to Create</h4>
            <p className="text-yellow-700 text-sm mt-1">
              Your bot will be created and ready to deploy. You can always modify these settings later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Voice Bot</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Configuration</h3>
                {renderStep1()}
              </div>
            )}
            {currentStep === 2 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Voice & Appearance</h3>
                {renderStep2()}
              </div>
            )}
            {currentStep === 3 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Knowledge Base (Optional)</h3>
                {renderStep3()}
              </div>
            )}
            {currentStep === 4 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Review & Create</h3>
                {renderStep4()}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-3">
              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleCreateBot}
                  disabled={isCreating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Bot'}
                </button>
              )}
            </div>
          </div>

          {errors.general && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
