# Sound Stream Ripper - Node.js Version

A modern Node.js + React application that downloads music from Spotify URLs by finding equivalent YouTube videos and converting them to MP3 with metadata.

## ✨ Features

- **Spotify Integration**: Extract track/playlist information from Spotify URLs
- **YouTube Search**: Automatically find matching videos on YouTube
- **High-Quality Downloads**: Download audio in MP3 format with 320kbps quality
- **Metadata Tagging**: Add proper ID3 tags including album artwork
- **Real-time Progress**: Live progress tracking and download logs
- **Modern UI**: Clean, responsive React interface with Bootstrap
- **Background Processing**: Non-blocking downloads with status updates

## 🎥 Demo

Watch a quick demo of the application in action:


https://github.com/user-attachments/assets/f277420e-22a7-4d71-b9f2-445b3463adc3




The screen recording demonstrates:
- The modern, responsive UI
- Entering a Spotify URL
- Real-time download progress tracking
- Successful file download with metadata

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- FFmpeg (for audio conversion)
- yt-dlp (for YouTube downloads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Sound-Stream-Ripper
   ```

2. **Install system dependencies**
   ```bash
   # Install yt-dlp (required for YouTube downloads)
   brew install yt-dlp
   
   # Install FFmpeg (required for audio conversion)
   brew install ffmpeg
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Configure Spotify API**
   
   Create `backend/config.js`:
   ```javascript
   module.exports = {
     spotify: {
       clientId: 'your_spotify_client_id',
       clientSecret: 'your_spotify_client_secret'
     },
     server: {
       port: 5001
     }
   };
   ```

   Get your Spotify credentials from: https://developer.spotify.com/dashboard

5. **Start the application**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 📁 Project Structure

```
Sound-Stream-Ripper/
├── backend/                 # Node.js Express API
│   ├── config.js           # Configuration settings
│   ├── server.js           # Main server file
│   ├── services/
│   │   ├── downloadService.js    # YouTube download logic
│   │   └── spotifyService.js     # Spotify API integration
│   ├── downloads/          # Downloaded files directory
│   └── package.json        # Backend dependencies
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── App.tsx         # Main React component
│   │   └── App.css         # Styling
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json with scripts
├── start.sh               # Startup script
├── README.md              # This file
└── SETUP.md              # Quick setup guide
```

## 🎵 How to Use

1. **Open the application** at http://localhost:3000

2. **Paste a Spotify URL** in the input field:
   - Single track: `https://open.spotify.com/track/...`
   - Playlist: `https://open.spotify.com/playlist/...`
   - Album: `https://open.spotify.com/album/...`

3. **Click "Download"** and watch the progress in real-time

4. **Find your files** in the `backend/downloads/` directory

## 🛠️ Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm run kill-ports` - Kill processes on ports 3000 and 5001

## 🔧 Configuration

### Backend Configuration (`backend/config.js`)

```javascript
module.exports = {
  spotify: {
    clientId: 'your_spotify_client_id',
    clientSecret: 'your_spotify_client_secret'
  },
  server: {
    port: 5001
  }
};
```

### Environment Variables

You can also use environment variables:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `PORT` (for backend server)

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find module 'ytdl-core'" Error**
   - This has been fixed by switching to `yt-dlp` and `youtube-dl-exec`
   - Make sure `yt-dlp` is installed: `brew install yt-dlp`

2. **Port Already in Use**
   - Run `npm run kill-ports` to free up ports 3000 and 5001
   - Or manually kill processes: `sudo lsof -t -i tcp:5001 | xargs kill -9`

3. **Download Failures**
   - Ensure you have a stable internet connection
   - Check that `yt-dlp` and `ffmpeg` are properly installed
   - Some videos may be geo-restricted or unavailable

4. **Spotify API Errors**
   - Verify your Spotify Client ID and Secret are correct
   - Make sure your Spotify app has the necessary permissions

### System Requirements

- **macOS**: Homebrew for installing dependencies
- **Linux**: Use your package manager (apt, yum, etc.)
- **Windows**: Use chocolatey or manual installation

### Installation Commands by OS

**macOS:**
```bash
brew install yt-dlp ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3-pip ffmpeg
pip3 install yt-dlp
```

**Windows:**
```bash
choco install yt-dlp ffmpeg
```

## 🚨 Important Notes

- **Legal**: Only download content you have the right to download
- **Quality**: Downloads are in MP3 format at 320kbps quality
- **Metadata**: Album artwork and track information are automatically added
- **Storage**: Downloaded files are saved in `backend/downloads/`
- **Performance**: The app uses system-installed `yt-dlp` for better reliability

## 🔄 Recent Updates

- ✅ Fixed path issues with spaces in directory names
- ✅ Switched from `ytdl-core` to `yt-dlp` for better reliability
- ✅ Improved error handling and fallback mechanisms
- ✅ Enhanced metadata tagging with album artwork
- ✅ Added real-time progress tracking
- ✅ Cleaned up project structure

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/download` - Start download process
- `GET /api/download/:id/status` - Get download status
- `GET /api/download/:id/logs` - Get download logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes. Please respect copyright laws and only download content you have the right to access.

---

**Note**: This application requires proper Spotify API credentials and system dependencies (yt-dlp, ffmpeg) to function correctly. See the setup guide for detailed installation instructions. 
