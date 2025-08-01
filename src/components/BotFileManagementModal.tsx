"use client";

import { useState, useEffect } from "react";

interface BotFileManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: {
    uuid: string;
    name: string;
    ragEnabled: boolean;
    documentsProcessed?: number;
  };
}

interface BotFile {
  name: string;
  size: number;
  uploadedAt: string;
  type: string;
}

export function BotFileManagementModal({ isOpen, onClose, bot }: BotFileManagementModalProps) {
  const [files, setFiles] = useState<BotFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    if (isOpen && bot.ragEnabled) {
      loadBotFiles();
    }
  }, [isOpen, bot.uuid]);

  const loadBotFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bots/${bot.uuid}/files`);
      const result = await response.json();
      
      if (result.success) {
        setFiles(result.files || []);
      } else {
        console.error('Failed to load bot files:', result.error);
      }
    } catch (error) {
      console.error('Error loading bot files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      setSelectedFiles(Array.from(fileList));
    }
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress('Preparing files...');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      setUploadProgress('Uploading files...');
      const response = await fetch(`/api/bots/${bot.uuid}/files`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadProgress('Upload successful!');
        setSelectedFiles([]);
        await loadBotFiles(); // Reload files list
        
        // Clear progress after 2 seconds
        setTimeout(() => {
          setUploadProgress('');
        }, 2000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setUploadProgress('');
      }, 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return null;
  }

  if (!bot.ragEnabled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">File Management</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">RAG Not Enabled</h3>
              <p className="text-gray-600">This bot doesn't have RAG (knowledge base) enabled. File management is only available for RAG-enabled bots.</p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Files</h2>
              <p className="text-gray-600 mt-1">Bot: {bot.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Upload Section */}
          <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Files</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Files
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.docx,.doc"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Selected files:</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="flex justify-between">
                        <span>• {file.name}</span>
                        <span>({formatFileSize(file.size)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {uploadProgress && (
                <div className={`p-3 rounded-lg ${
                  uploadProgress.includes('failed') || uploadProgress.includes('error')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : uploadProgress.includes('successful')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {uploadProgress}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleUploadFiles}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>

          {/* Files List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Files</h3>
              <button
                onClick={loadBotFiles}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading files...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h4>
                <p className="text-gray-600">Upload some documents to give your bot knowledge about your business.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{file.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{formatDate(file.uploadedAt)}</span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">{file.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
