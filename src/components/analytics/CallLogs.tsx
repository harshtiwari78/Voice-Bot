"use client";

import { useState, useEffect } from 'react';

interface CallLog {
  id: string;
  assistantId: string;
  status: string;
  createdAt: string;
  startedAt: string;
  endedAt: string;
  duration: number | null;
  phoneNumber: string;
  type: string;
  cost: number;
  hasTranscript: boolean;
  hasRecording: boolean;
  recordingUrl: string | null;
  messageCount: number;
  summary: string | null;
  transcript: string | null;
}

interface CallLogsData {
  logs: CallLog[];
  summary: {
    totalCalls: number;
    callsWithTranscripts: number;
    callsWithRecordings: number;
    totalMessages: number;
    totalCost: number;
    avgDuration: number;
  };
  distributions: {
    status: Array<{
      status: string;
      count: number;
    }>;
    assistant: Array<{
      assistantId: string;
      callCount: number;
      totalDuration: number;
      totalCost: number;
    }>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface CallLogsProps {
  timeRange: string;
}

export function CallLogs({ timeRange }: CallLogsProps) {
  const [data, setData] = useState<CallLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());
  const [playingRecordings, setPlayingRecordings] = useState<Set<string>>(new Set());
  const [callDetails, setCallDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCallLogs();
  }, [timeRange, selectedStatus, selectedAssistant, currentPage]);

  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ 
        timeRange,
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedAssistant) params.append('assistantId', selectedAssistant);
      
      const response = await fetch(`/api/analytics/logs?${params}`);
      const result = await response.json();

      if (result.success) {
        // Ensure all required properties exist with defaults
        const safeData = {
          logs: result.logs || [],
          summary: result.summary || {
            totalCalls: 0,
            callsWithTranscripts: 0,
          callsWithRecordings: 0,
            totalMessages: 0,
            totalCost: 0,
            avgDuration: 0
          },
          distributions: result.distributions || {
            status: [],
            assistant: []
          },
          pagination: result.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            hasMore: false
          }
        };
        setData(safeData);
      } else {
        setError(result.error || 'Failed to load call logs');
      }
    } catch (err) {
      setError('Failed to fetch call logs');
      console.error('Call logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallDetails = async (callId: string) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/analytics/logs?callId=${callId}`);
      const result = await response.json();

      if (result.success) {
        setCallDetails(result.call);
        setSelectedCall(callId);
      } else {
        console.error('Failed to fetch call details:', result.error);
      }
    } catch (err) {
      console.error('Failed to fetch call details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeCallDetails = () => {
    setSelectedCall(null);
    setCallDetails(null);
  };

  const toggleTranscript = (callId: string) => {
    const newExpanded = new Set(expandedTranscripts);
    if (newExpanded.has(callId)) {
      newExpanded.delete(callId);
    } else {
      newExpanded.add(callId);
    }
    setExpandedTranscripts(newExpanded);
  };

  const toggleRecordingPlayer = (callId: string) => {
    const newPlaying = new Set(playingRecordings);
    if (newPlaying.has(callId)) {
      newPlaying.delete(callId);
    } else {
      newPlaying.add(callId);
    }
    setPlayingRecordings(newPlaying);
  };

  const handleRecordingAction = (recordingUrl: string, action: 'play' | 'download', callId?: string) => {
    if (!recordingUrl) return;

    if (action === 'play' && callId) {
      // Toggle embedded audio player
      toggleRecordingPlayer(callId);
    } else if (action === 'download') {
      // Create download link
      const link = document.createElement('a');
      link.href = recordingUrl;
      link.download = `call-recording-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
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

  const exportLogs = () => {
    if (!data?.logs || data.logs.length === 0) return;
    
    const csvContent = [
      ['Call ID', 'Status', 'Duration', 'Created', 'Phone', 'Type', 'Cost'].join(','),
      ...data.logs.map(log => [
        log.id,
        log.status,
        formatDuration(log.duration),
        new Date(log.createdAt).toLocaleString(),
        log.phoneNumber || 'N/A',
        log.type,
        `$${log.cost.toFixed(2)}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-logs-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Call Logs</h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Call Logs</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchCallLogs}
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
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold text-gray-900">Call Logs</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {(data.distributions?.status || []).map((status) => (
              <option key={status.status} value={status.status}>
                {status.status} ({status.count})
              </option>
            ))}
          </select>

          <select
            value={selectedAssistant}
            onChange={(e) => setSelectedAssistant(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Assistants</option>
            {(data.distributions?.assistant || []).map((assistant) => (
              <option key={assistant.assistantId} value={assistant.assistantId}>
                {assistant.assistantId.substring(0, 8)}... ({assistant.callCount} calls)
              </option>
            ))}
          </select>
          
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-2xl font-bold text-blue-600">{data.summary?.totalCalls || 0}</p>
          <p className="text-sm text-gray-600">Total Calls</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-2xl font-bold text-green-600">{data.summary?.callsWithTranscripts || 0}</p>
          <p className="text-sm text-gray-600">With Transcripts</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-2xl font-bold text-indigo-600">{data.summary?.callsWithRecordings || 0}</p>
          <p className="text-sm text-gray-600">With Recordings</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-2xl font-bold text-purple-600">{data.summary?.totalMessages || 0}</p>
          <p className="text-sm text-gray-600">Total Messages</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-2xl font-bold text-orange-600">${(data.summary?.totalCost || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-600">Total Cost</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-2xl font-bold text-gray-600">{formatDuration(data.summary?.avgDuration || 0)}</p>
          <p className="text-sm text-gray-600">Avg Duration</p>
        </div>
      </div>

      {/* Call Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Call Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transcript
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(data.logs || []).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.id.substring(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.phoneNumber || 'No phone'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(log.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span>{log.messageCount}</span>
                        {log.hasTranscript && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            📝 Transcript
                          </span>
                        )}
                        {log.hasRecording && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            🎵 Recording
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.hasTranscript && log.transcript ? (
                        <div>
                          <button
                            onClick={() => toggleTranscript(log.id)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            {expandedTranscripts.has(log.id) ? '📄 Hide' : '📄 Show'}
                          </button>
                          {expandedTranscripts.has(log.id) && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg max-w-md">
                              <div className="text-xs text-gray-600 mb-1">Transcript:</div>
                              <div className="text-sm text-gray-800 max-h-32 overflow-y-auto">
                                {log.transcript}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No transcript</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${log.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => fetchCallDetails(log.id)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={loadingDetails}
                          >
                            {loadingDetails && selectedCall === log.id ? 'Loading...' : 'View Details'}
                          </button>
                          {log.hasRecording && log.recordingUrl && (
                            <>
                              <button
                                onClick={() => handleRecordingAction(log.recordingUrl!, 'play', log.id)}
                                className="text-purple-600 hover:text-purple-900"
                                title={playingRecordings.has(log.id) ? "Hide Player" : "Show Player"}
                              >
                                {playingRecordings.has(log.id) ? '⏹️' : '▶️'}
                              </button>
                              <button
                                onClick={() => handleRecordingAction(log.recordingUrl!, 'download')}
                                className="text-green-600 hover:text-green-900"
                                title="Download Recording"
                              >
                                📥
                              </button>
                            </>
                          )}
                        </div>
                        {log.hasRecording && log.recordingUrl && playingRecordings.has(log.id) && (
                          <div className="mt-2">
                            <audio
                              controls
                              className="w-full max-w-xs"
                              preload="metadata"
                            >
                              <source src={log.recordingUrl} type="audio/wav" />
                              <source src={log.recordingUrl} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination && data.pagination.total > (data.pagination.limit || 20) && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * (data.pagination.limit || 20)) + 1} to{' '}
                {Math.min(currentPage * (data.pagination.limit || 20), data.pagination.total || 0)} of{' '}
                {data.pagination.total || 0} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!data.pagination?.hasMore}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call Details Modal */}
      {selectedCall && callDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Call Details</h3>
                <button
                  onClick={closeCallDetails}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
                  <div className="space-y-2 text-gray-700">
                    <div><strong className="text-gray-900">Call ID:</strong> {callDetails.id}</div>
                    <div><strong className="text-gray-900">Assistant ID:</strong> {callDetails.assistantId}</div>
                    <div><strong className="text-gray-900">Status:</strong>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        callDetails.status === 'ended' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {callDetails.status}
                      </span>
                    </div>
                    <div><strong className="text-gray-900">End Reason:</strong> {callDetails.endedReason || 'N/A'}</div>
                    <div><strong className="text-gray-900">Phone Number:</strong> {callDetails.phoneNumber || 'N/A'}</div>
                    <div><strong className="text-gray-900">Type:</strong> {callDetails.type || 'Unknown'}</div>
                  </div>
                </div>

                {/* Timing & Duration */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Timing & Duration</h4>
                  <div className="space-y-2 text-gray-700">
                    <div><strong className="text-gray-900">Created:</strong> {new Date(callDetails.createdAt).toLocaleString()}</div>
                    <div><strong className="text-gray-900">Started:</strong> {callDetails.startedAt ? new Date(callDetails.startedAt).toLocaleString() : 'N/A'}</div>
                    <div><strong className="text-gray-900">Ended:</strong> {callDetails.endedAt ? new Date(callDetails.endedAt).toLocaleString() : 'N/A'}</div>
                    <div><strong className="text-gray-900">Duration:</strong> {callDetails.duration ? `${Math.round(callDetails.duration)}s` : 'N/A'}</div>
                    <div><strong className="text-gray-900">Cost:</strong> ${(callDetails.cost || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Transcript */}
              {callDetails.transcript && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Transcript</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {callDetails.transcript}
                    </pre>
                  </div>
                </div>
              )}

              {/* Recording */}
              {callDetails.recording && callDetails.recording.available && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Recording</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <div><strong>Available:</strong> Yes</div>
                      <div><strong>Type:</strong> {callDetails.recording.type || 'audio/wav'}</div>
                      <div><strong>Size:</strong> {callDetails.recording.size ? `${Math.round(parseInt(callDetails.recording.size) / 1024)} KB` : 'Unknown'}</div>
                    </div>
                    <audio controls className="w-full">
                      <source src={callDetails.recording.url} type="audio/wav" />
                      <source src={callDetails.recording.url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              )}

              {/* Messages */}
              {callDetails.messages && callDetails.messages.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Messages ({callDetails.messages.length})</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {callDetails.messages.map((message: any, index: number) => (
                        <div key={index} className="text-sm">
                          <strong>{message.role}:</strong> {message.message || message.content}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis */}
              {callDetails.analysis && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Analysis</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {JSON.stringify(callDetails.analysis, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
