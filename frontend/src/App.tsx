import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const API_URL = 'http://localhost:5001/api';

// Create a configured axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

interface DownloadStatus {
  status: string;
  progress: number;
  message: string;
  log: string[];
  completed: number;
  total: number;
  errors: string[];
}

function App() {
  const [url, setUrl] = useState<string>('');
  const [downloadPath, setDownloadPath] = useState<string>('');
  const [fileExistsAction, setFileExistsAction] = useState<string>('SKIP');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [status, setStatus] = useState<DownloadStatus>({
    status: '',
    progress: 0,
    message: '',
    log: [],
    completed: 0,
    total: 0,
    errors: []
  });
  const [error, setError] = useState<string>('');
  const [validUrl, setValidUrl] = useState<boolean | null>(null);
  
  // Check URL validity when input changes
  useEffect(() => {
    const checkUrl = async () => {
      if (url.trim() === '') {
        setValidUrl(null);
        return;
      }
      
      try {
        console.log('Validating URL:', url);
        const response = await api.post('/validate', { url });
        console.log('Validation response:', response.data);
        
        setValidUrl(response.data.valid);
        if (!response.data.valid) {
          setError(response.data.error);
        } else {
          setError('');
        }
      } catch (err: any) {
        console.error('Validation error:', err);
        console.error('Error details:', err.response || err.message);
        setValidUrl(false);
        setError('Error validating URL: ' + (err.response?.data?.error || err.message));
      }
    };
    
    const timer = setTimeout(checkUrl, 500); // Debounce URL validation
    return () => clearTimeout(timer);
  }, [url]);
  
  // Poll download status
  useEffect(() => {
    if (!downloadId || !downloading) return;
    
    const intervalId = setInterval(async () => {
      try {
        const response = await api.get(`/download-status/${downloadId}`);
        setStatus(response.data);
        
        if (['completed', 'error'].includes(response.data.status)) {
          setDownloading(false);
        }
      } catch (err: any) {
        console.error('Error fetching download status:', err);
        console.error('Status error details:', err.response || err.message);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [downloadId, downloading]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validUrl) return;
    
    try {
      setError('');
      setDownloading(true);
      
      console.log('Starting download for URL:', url);
      const response = await api.post('/start-download', {
        url,
        downloadPath,
        fileExistsAction
      });
      
      console.log('Download started:', response.data);
      setDownloadId(response.data.downloadId);
    } catch (err: any) {
      console.error('Download start error:', err);
      console.error('Download error details:', err.response || err.message);
      setError('Error starting download: ' + (err.response?.data?.error || err.message));
      setDownloading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow">
            <div className="card-header bg-dark text-white">
              <h1 className="text-center mb-0">🎵 Sound Stream Ripper</h1>
              <p className="text-center mb-0 mt-2">Download music from Spotify via YouTube</p>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Spotify URL (Track or Playlist)</strong>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${validUrl === true ? 'is-valid' : ''} ${validUrl === false ? 'is-invalid' : ''}`}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://open.spotify.com/track/... or https://open.spotify.com/playlist/..."
                  />
                  {validUrl === true && (
                    <div className="valid-feedback">
                      Valid Spotify URL ✓
                    </div>
                  )}
                  {validUrl === false && (
                    <div className="invalid-feedback">
                      {error}
                    </div>
                  )}
                </div>
                
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Download Location (Optional)</strong>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={downloadPath}
                    onChange={(e) => setDownloadPath(e.target.value)}
                    placeholder="Leave blank for default location (./downloads)"
                  />
                  <div className="form-text">
                    Specify a custom path or leave empty to use the default downloads folder
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">
                    <strong>If file exists:</strong>
                  </label>
                  <select 
                    className="form-select"
                    value={fileExistsAction}
                    onChange={(e) => setFileExistsAction(e.target.value)}
                  >
                    <option value="SKIP">Skip existing files</option>
                    <option value="REPLACE">Replace existing files</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mt-3"
                  disabled={!validUrl || downloading}
                >
                  {downloading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download me-2"></i>
                      Start Download
                    </>
                  )}
                </button>
              </form>
              
              {error && !downloading && (
                <div className="mt-3 alert alert-danger">
                  <strong>Error:</strong> {error}
                </div>
              )}
              
              {downloading && (
                <div className="mt-4">
                  <div className={`alert alert-${getStatusColor(status.status)} mb-3`}>
                    <strong>Status:</strong> {status.message || 'Preparing download...'}
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <h6>Progress: {status.completed || 0}/{status.total || '?'} tracks</h6>
                    </div>
                    <div className="col-md-6 text-end">
                      <h6>{status.progress || 0}% Complete</h6>
                    </div>
                  </div>
                  
                  <div className="progress mb-3" style={{ height: '20px' }}>
                    <div
                      className={`progress-bar progress-bar-striped progress-bar-animated bg-${getStatusColor(status.status)}`}
                      role="progressbar"
                      style={{width: `${status.progress || 0}%`}}
                      aria-valuenow={status.progress || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {status.progress || 0}%
                    </div>
                  </div>
                  
                  <div className="card mt-3">
                    <div className="card-header">
                      <h6 className="mb-0">📋 Download Log</h6>
                    </div>
                    <div className="card-body" style={{maxHeight: '300px', overflow: 'auto', backgroundColor: '#f8f9fa'}}>
                      {status.log && status.log.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {status.log.map((entry, i) => (
                            <div key={i} className="list-group-item list-group-item-action border-0 py-1 px-2 small">
                              {entry}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No log entries yet...</p>
                      )}
                    </div>
                  </div>
                  
                  {status.errors && status.errors.length > 0 && (
                    <div className="mt-3 alert alert-warning">
                      <h6>⚠️ Errors encountered:</h6>
                      <ul className="mb-0">
                        {status.errors.map((error, i) => (
                          <li key={i} className="small">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {status.status === 'completed' && (
                <div className="mt-3 alert alert-success">
                  <h5>🎉 Download completed!</h5>
                  <p className="mb-0">
                    Successfully downloaded <strong>{status.completed}</strong> of <strong>{status.total}</strong> tracks.
                  </p>
                  {status.completed < status.total && (
                    <small className="text-muted">
                      Some tracks may have been skipped or failed to download.
                    </small>
                  )}
                </div>
              )}
            </div>
            <div className="card-footer text-center text-muted">
              <small>
                🚀 Powered by Node.js + React | 
                🎵 Spotify API + YouTube | 
                ⚡ Built with ❤️
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
