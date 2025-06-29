# 🚀 Quick Setup Guide

## Prerequisites
1. **Node.js** (v16+) - [Download here](https://nodejs.org/)
2. **FFmpeg** - Required for audio conversion
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu**: `sudo apt install ffmpeg`
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
3. **yt-dlp** - Required for YouTube downloading
   - **macOS**: `brew install yt-dlp`
   - **Ubuntu**: `sudo apt install yt-dlp` or `pip install yt-dlp`
   - **Windows**: Download from [yt-dlp.org](https://github.com/yt-dlp/yt-dlp)

## 🏃‍♂️ Quick Start (3 steps)

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Start the Application
```bash
npm run dev
```
OR use the startup script:
```bash
./start.sh
```

### 3. Open Your Browser
- Go to `http://localhost:3000`
- Paste a Spotify URL
- Start downloading!

## 📱 Usage

1. **Single Track**: `https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh`
2. **Playlist**: `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M`

## 📁 Downloads Location
- Default: `./downloads/` folder in the project root
- Files are saved as: `Artist - Track Title.mp3`
- Includes metadata: artist, album, artwork, etc.

## 🔧 Troubleshooting

**Port already in use?**
```bash
# Kill processes on ports 3000 and 5001
npm run kill-ports
```

**FFmpeg not found?**
- Make sure FFmpeg is installed and in your PATH
- Restart your terminal after installation

**yt-dlp not found?**
- Make sure yt-dlp is installed: `brew install yt-dlp` (macOS)
- Restart your terminal after installation

**Download fails with "Could not extract functions"?**
- This has been fixed! We now use yt-dlp instead of ytdl-core
- yt-dlp is more reliable and frequently updated

**Spotify URL not working?**
- Make sure playlists are set to public
- Try copying the URL directly from Spotify

**Downloads showing 0 of X tracks?**
- Check that yt-dlp is installed: `which yt-dlp`
- Check the download logs in the UI for specific error messages
- Some videos might be region-restricted or unavailable

## 🎯 What's Different from Python Version?

✅ **Better Performance** - Node.js handles async operations better
✅ **Modern UI** - React with TypeScript and Bootstrap
✅ **Real-time Updates** - Live progress tracking
✅ **Better Error Handling** - Detailed error messages and logs
✅ **Cross-platform** - Works on Windows, macOS, and Linux
✅ **No Python Dependencies** - Only needs Node.js, FFmpeg, and yt-dlp
✅ **More Reliable Downloads** - Uses yt-dlp instead of ytdl-core
✅ **Better YouTube Search** - Multiple fallback methods

## 🔧 Recent Improvements

### v2.0 - Enhanced Download System
- ✅ Replaced problematic `ytdl-core` with `yt-dlp`
- ✅ Added better YouTube search with `youtube-search-api`
- ✅ Multiple fallback download methods
- ✅ More reliable audio extraction
- ✅ Better error handling and logging
- ✅ Improved metadata tagging

---

**Ready to download? Run `npm run dev` and visit http://localhost:3000!** 🎵 