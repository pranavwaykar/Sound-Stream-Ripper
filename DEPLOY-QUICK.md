# 🚀 Quick Deploy Guide

## Railway (Recommended - 5 minutes)

### 1. Prepare Code
```bash
./deploy-railway.sh
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your `Sound-Stream-Ripper` repository
5. Railway will automatically build and deploy!

### 3. Set Environment Variables (Optional)
In Railway dashboard → Variables:
- `NODE_ENV=production`
- `PORT=5001`

### 4. Get Your Live URL
- Railway provides: `https://your-app-name.up.railway.app`
- Your app will be live in 5-10 minutes!

---

## Alternative: Render

### 1. Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New"** → **"Web Service"**
4. Connect your GitHub repo
5. Use these settings:
   - **Build Command**: `npm run deploy:setup`
   - **Start Command**: `npm start`

### 2. Environment Variables
- `NODE_ENV=production`

---

## ✅ What's Included

Your deployment includes:
- ✅ Full-stack app (React frontend + Node.js backend)
- ✅ Matrix-style music note background
- ✅ Spotify URL processing
- ✅ YouTube download & MP3 conversion
- ✅ File download functionality
- ✅ Beautiful UI with download button
- ✅ FFmpeg & yt-dlp pre-configured

## 🎯 After Deployment

1. Visit your live URL
2. Paste a Spotify URL
3. Click Download
4. Wait for processing
5. Click "Download Files" when complete
6. Enjoy your MP3! 🎵

**Estimated deployment time: 5-10 minutes**
**Free tier available on both platforms!** 