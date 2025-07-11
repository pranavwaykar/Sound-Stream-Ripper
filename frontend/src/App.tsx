import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

interface DownloadStatus {
  id: string;
  status: string;
  progress: number;
  message: string;
  log: string[];
  completed: number;
  total: number;
  errors: string[];
}

function App() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp3');
  const [quality, setQuality] = useState('192');
  const [isLoading, setIsLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(null);

  // Check if URL is valid Spotify URL
  const isValidSpotifyUrl = (url: string) => {
    const spotifyRegex = /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+(\?.*)?$/;
    return spotifyRegex.test(url);
  };

  // Real-time URL validation
  useEffect(() => {
    const checkUrl = async () => {
      if (url && isValidSpotifyUrl(url)) {
        try {
          const response = await fetch(`http://localhost:5001/api/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });
          const data = await response.json();
          if (data.valid) {
            // URL is valid, could show preview info here
          }
        } catch (error) {
          console.error('Error validating URL:', error);
        }
      }
    };

    const timeoutId = setTimeout(checkUrl, 500);
    return () => clearTimeout(timeoutId);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidSpotifyUrl(url)) {
      alert('Please enter a valid Spotify URL');
      return;
    }

    setIsLoading(true);
    setDownloadStatus(null);

    try {
      const response = await fetch('http://localhost:5001/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          format,
          quality,
        }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const data = await response.json();
      
      // Start polling for status updates using the correct endpoint
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`http://localhost:5001/api/download/${data.downloadId}/status`);
          if (!statusResponse.ok) {
            throw new Error('Failed to get status');
          }
          const statusData = await statusResponse.json();
          

          
          setDownloadStatus(statusData);
          
          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            setIsLoading(false);
            
            // Automatically download the file when processing is completed
            await autoDownloadFile(statusData.id);
          } else if (statusData.status === 'error' || statusData.status === 'failed') {
            clearInterval(pollInterval);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error polling status:', error);
          clearInterval(pollInterval);
          setIsLoading(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      setDownloadStatus({
        id: '',
        status: 'failed',
        progress: 0,
        message: 'Download failed. Please try again.',
        log: [],
        completed: 0,
        total: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-info';
      case 'downloading': return 'bg-warning';
      case 'downloaded': return 'bg-success';
      case 'download_failed':
      case 'failed': 
      case 'error': return 'bg-danger';
      case 'processing': 
      case 'started': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'started': return 'INITIALIZING...';
      case 'processing': return 'PROCESSING...';
      case 'completed': return 'PROCESSING COMPLETED';
      case 'downloading': return 'DOWNLOADING TO DEVICE...';
      case 'downloaded': return 'DOWNLOADED SUCCESSFULLY';
      case 'download_failed': return 'DOWNLOAD FAILED';
      case 'error': return 'ERROR';
      case 'failed': return 'FAILED';
      default: return status.toUpperCase();
    }
  };

  const autoDownloadFile = async (downloadId: string) => {
    try {
      // Update status to show file is being downloaded
      setDownloadStatus(prev => prev ? {
        ...prev,
        message: 'Downloading file to your device...',
        status: 'downloading'
      } : null);

      const response = await fetch(`http://localhost:5001/api/download/${downloadId}/file`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      
      let filename = 'download.mp3';
      if (contentDisposition) {
        // Try multiple methods to extract filename
        // Method 1: RFC 6266 compliant regex
        let match = contentDisposition.match(/filename\*?=['"]?([^'";]+)['"]?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        } else {
          // Method 2: Simple split on filename=
          const parts = contentDisposition.split('filename=');
          if (parts.length > 1) {
            filename = parts[1].replace(/['"]/g, '').trim();
          } else {
            // Method 3: Try to find any quoted string
            match = contentDisposition.match(/"([^"]+)"/);
            if (match && match[1]) {
              filename = match[1];
            }
          }
        }
      } else {
        // Fallback: try to get filename from download status
        try {
          const statusResponse = await fetch(`http://localhost:5001/api/download/${downloadId}/status`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.completedFiles && statusData.completedFiles.length > 0) {
              const filePath = statusData.completedFiles[0];
              filename = filePath.split('/').pop() || 'download.mp3';
            }
          }
        } catch (fallbackError) {
          console.error('Could not get filename from status:', fallbackError);
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      

      
      // Update status to show download completed
      setDownloadStatus(prev => prev ? {
        ...prev,
        message: `File downloaded successfully: ${filename}`,
        status: 'downloaded'
      } : null);
      

      
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus(prev => prev ? {
        ...prev,
        message: 'Failed to download file to your device',
        status: 'download_failed',
        errors: [...(prev.errors || []), error instanceof Error ? error.message : 'Download failed']
      } : null);
    }
  };

  return (
    <div className="container mt-5">
      {/* Matrix-Style Music Notes Rain */}
      <div className="music-matrix">
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="music-column">
            <span className="music-note-char">♪</span>
            <span className="music-note-char">♫</span>
            <span className="music-note-char">♬</span>
            <span className="music-note-char">♩</span>
            <span className="music-note-char">♪</span>
            <span className="music-note-char">♫</span>
            <span className="music-note-char">♬</span>
            <span className="music-note-char">♩</span>
          </div>
        ))}
      </div>

      {/* Main Application Card */}
      <div className="card shadow-lg" style={{ position: 'relative', zIndex: 2 }}>
        <div className="card-header bg-primary text-white">
          <h2 className="mb-0">🎵 Sound Stream Ripper</h2>
          <small>Download music from Spotify URLs</small>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="url" className="form-label">
                Spotify URL
              </label>
              <input
                type="url"
                className="form-control"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="format" className="form-label">
                Download Format
              </label>
              <select
                className="form-select"
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="flac">FLAC</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="quality" className="form-label">
                Quality
              </label>
              <select
                className="form-select"
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="128">128 kbps</option>
                <option value="192">192 kbps</option>
                <option value="320">320 kbps</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Processing & Downloading...
                </>
              ) : (
                <>
                  <i className="fas fa-download me-2"></i>
                  Download & Save to Device
                </>
              )}
            </button>
          </form>

          {/* Status Display */}
          {downloadStatus && (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold">Status:</span>
                <span className={`badge ${getStatusColor(downloadStatus.status)}`}>
                  {getStatusText(downloadStatus.status)}
                </span>
              </div>
              
              {downloadStatus.progress > 0 && (
                <div className="mb-3">
                  <div className="progress">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${downloadStatus.progress}%` }}
                      aria-valuenow={downloadStatus.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {downloadStatus.progress}%
                    </div>
                  </div>
                </div>
              )}

              {downloadStatus.message && (
                <div className="alert alert-info">
                  {downloadStatus.message}
                </div>
              )}

              {downloadStatus.errors && downloadStatus.errors.length > 0 && (
                <div className="alert alert-danger">
                  <strong>Errors:</strong>
                  <ul className="mb-0 mt-2">
                    {downloadStatus.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {downloadStatus.log && downloadStatus.log.length > 0 && (
                <div className="mt-3">
                  <details>
                    <summary className="btn btn-outline-secondary btn-sm">
                      View Log ({downloadStatus.log.length} entries)
                    </summary>
                    <div className="mt-2 p-3 bg-dark text-light rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <pre className="mb-0 small">
                        {downloadStatus.log.join('\n')}
                      </pre>
                    </div>
                  </details>
                </div>
              )}

              {(downloadStatus.status === 'completed' || downloadStatus.status === 'downloading' || downloadStatus.status === 'downloaded') && (
                <div className="mt-3">
                  <div className={`alert ${downloadStatus.status === 'downloaded' ? 'alert-success' : 'alert-info'}`}>
                    <i className={`fas ${downloadStatus.status === 'downloaded' ? 'fa-check-circle' : 'fa-info-circle'} me-2`}></i>
                    {downloadStatus.status === 'completed' && 'Processing completed! Starting download...'}
                    {downloadStatus.status === 'downloading' && 'Downloading file to your device...'}
                    {downloadStatus.status === 'downloaded' && 'File downloaded successfully to your device!'}
                    {downloadStatus.completed > 0 && (
                      <span> ({downloadStatus.completed} file{downloadStatus.completed > 1 ? 's' : ''} processed)</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 