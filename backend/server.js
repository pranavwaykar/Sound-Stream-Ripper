const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const spotifyService = require('./services/spotifyService');
const downloadService = require('./services/downloadService');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for all routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /\.railway\.app$/,
        /\.render\.com$/,
        /\.herokuapp\.com$/,
        /\.vercel\.app$/
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// In-memory storage for download progress (in production, use Redis or database)
const downloads = new Map();

// Multer configuration for file uploads (if needed)
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sound Stream Ripper API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Validate Spotify URL endpoint
app.post('/api/validate', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }

    // Basic URL validation
    const spotifyUrlRegex = /^https:\/\/open\.spotify\.com\/(track|playlist|album)\/[a-zA-Z0-9]+/;
    
    if (!spotifyUrlRegex.test(url)) {
      return res.status(400).json({ 
        error: 'Invalid Spotify URL format' 
      });
    }

    // Get basic info from Spotify
    const info = await spotifyService.getInfo(url);
    
    res.json({
      valid: true,
      type: info.type,
      data: info.data,
      message: `Found ${info.type === 'track' ? '1 track' : `${info.data.length} tracks`}`
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to validate Spotify URL' 
    });
  }
});

// Start download endpoint
app.post('/api/download', async (req, res) => {
  try {
    const { url, format, quality, downloadPath, fileExistsAction } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'Spotify URL is required' 
      });
    }

    // Generate unique download ID
    const downloadId = uuidv4();
    
    // Set default download path
    const finalDownloadPath = downloadPath || downloadsDir;
    
    // Initialize download state
    downloads.set(downloadId, {
      id: downloadId,
      url,
      format: format || 'mp3',
      quality: quality || '192',
      status: 'started',
      progress: 0,
      completed: 0,
      total: 0,
      message: 'Starting download...',
      log: [],
      errors: [],
      startTime: Date.now()
    });

    // Start download process in background
    downloadService.processDownload(
      downloadId, 
      url, 
      finalDownloadPath, 
      fileExistsAction || 'skip',
      downloads
    ).catch(error => {
      console.error('Download process error:', error);
      const downloadState = downloads.get(downloadId);
      if (downloadState) {
        downloadState.status = 'error';
        downloadState.message = error.message;
        downloadState.errors.push(error.message);
        downloads.set(downloadId, downloadState);
      }
    });

    res.json({
      downloadId,
      message: 'Download started',
      status: 'started'
    });

  } catch (error) {
    console.error('Download start error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to start download' 
    });
  }
});

// Get download status endpoint
app.get('/api/download/:id/status', (req, res) => {
  const { id } = req.params;
  const downloadState = downloads.get(id);
  
  if (!downloadState) {
    return res.status(404).json({ 
      error: 'Download not found' 
    });
  }
  

  
  res.json(downloadState);
});

// List all downloads endpoint (for debugging)
app.get('/api/downloads/status', (req, res) => {
  const allDownloads = Array.from(downloads.entries()).map(([id, state]) => ({
    id,
    status: state.status,
    message: state.message,
    progress: state.progress,
    completed: state.completed,
    total: state.total,
    errors: state.errors.length
  }));
  
  res.json(allDownloads);
});

// Download completed file endpoint
app.get('/api/download/:id/file', (req, res) => {
  const { id } = req.params;
  const downloadState = downloads.get(id);
  
  if (!downloadState) {
    return res.status(404).json({ 
      error: 'Download not found' 
    });
  }
  
  if (downloadState.status !== 'completed') {
    return res.status(400).json({ 
      error: 'Download not completed yet' 
    });
  }
  
  // Get the first completed file (for single track downloads)
  const completedFiles = downloadState.completedFiles || [];
  
  if (completedFiles.length === 0) {
    return res.status(404).json({ 
      error: 'No files found' 
    });
  }
  
  const filePath = completedFiles[0];
  const fileName = path.basename(filePath);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      error: 'File not found on server' 
    });
  }
  

  
  // Set appropriate headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'audio/mpeg');
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (err) => {
    console.error('Error streaming file:', err);
    res.status(500).json({ error: 'Error downloading file' });
  });
});

// List completed files endpoint
app.get('/api/downloads/files', (req, res) => {
  const completedDownloads = Array.from(downloads.entries())
    .filter(([id, state]) => state.status === 'completed')
    .map(([id, state]) => ({
      id,
      files: (state.completedFiles || []).map(filePath => ({
        filename: path.basename(filePath),
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
        downloadUrl: `/api/download/${id}/file`
      }))
    }));
  
  res.json(completedDownloads);
});

// Get download logs endpoint
app.get('/api/download/:id/logs', (req, res) => {
  const { id } = req.params;
  const downloadState = downloads.get(id);
  
  if (!downloadState) {
    return res.status(404).json({ 
      error: 'Download not found' 
    });
  }
  
  res.json({
    id: downloadState.id,
    log: downloadState.log,
    errors: downloadState.errors
  });
});

// List downloaded files endpoint
app.get('/api/downloads', (req, res) => {
  try {
    const files = fs.readdirSync(downloadsDir)
      .filter(file => file.endsWith('.mp3'))
      .map(file => ({
        name: file,
        size: fs.statSync(path.join(downloadsDir, file)).size,
        modified: fs.statSync(path.join(downloadsDir, file)).mtime
      }))
      .sort((a, b) => b.modified - a.modified);
    
    res.json(files);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ 
      error: 'Failed to list downloaded files' 
    });
  }
});

// Download file endpoint
app.get('/api/download/file/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(downloadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found' 
      });
    }
    
    res.download(filePath, filename);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ 
      error: 'Failed to download file' 
    });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Sound Stream Ripper API running on port ${PORT}`);
  console.log(`Downloads will be saved to: ${downloadsDir}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`Serving React app from: ${path.join(__dirname, '../frontend/build')}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 