# 🚀 Deployment Guide

This guide covers multiple deployment options for the Sound Stream Ripper application.

## 🌟 Option 1: Railway (Recommended)

Railway is perfect for full-stack applications with file handling and provides generous free tier.

### Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the configuration

4. **Environment Variables**
   Set these in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=5001
   ```

5. **Domain**
   - Railway provides a free domain: `your-app.railway.app`
   - You can add a custom domain later

### Features:
- ✅ Free tier with 500 hours/month
- ✅ Automatic deployments from GitHub
- ✅ Built-in file storage
- ✅ FFmpeg support
- ✅ Easy scaling

---

## 🌐 Option 2: Render

Great for full-stack apps with static site hosting.

### Steps:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - New → Web Service
   - Connect your GitHub repo
   - Use these settings:
     ```
     Build Command: npm run deploy:setup
     Start Command: npm start
     ```

3. **Environment Variables**
   ```
   NODE_ENV=production
   ```

### Features:
- ✅ Free tier available
- ✅ Automatic SSL
- ✅ Git-based deployments
- ✅ Good performance

---

## ☁️ Option 3: Heroku

Classic platform with extensive add-ons.

### Steps:

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Or download from heroku.com
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Add Buildpacks**
   ```bash
   heroku buildpacks:add heroku/nodejs
   heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Features:
- ✅ Mature platform
- ✅ Many add-ons
- ❌ No free tier anymore
- ✅ Excellent documentation

---

## 🐳 Option 4: Docker + DigitalOcean

For full control and scaling.

### Docker Setup:

1. **Build and Test Locally**
   ```bash
   docker build -t sound-stream-ripper .
   docker run -p 5001:5001 sound-stream-ripper
   ```

2. **Deploy to DigitalOcean App Platform**
   - Create account at digitalocean.com
   - Use App Platform
   - Connect GitHub repo
   - Use the existing Dockerfile

### Features:
- ✅ Full control
- ✅ Excellent performance
- ✅ Scalable
- ❌ Requires more setup

---

## 🔧 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All dependencies are in package.json files
- [ ] Environment variables are configured
- [ ] Frontend build works: `cd frontend && npm run build`
- [ ] Backend starts properly: `cd backend && npm start`
- [ ] CORS is configured for production domain
- [ ] File upload/download paths are correct

---

## 🌍 Environment Variables

Set these in your deployment platform:

```bash
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-domain.com  # Update CORS settings
```

---

## 📝 Quick Start (Railway - Recommended)

1. Push code to GitHub
2. Connect to Railway
3. Deploy automatically
4. Get your live URL!

**Estimated deployment time: 5-10 minutes**

---

## 🆘 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check all package.json files have correct dependencies
   - Ensure Node.js version compatibility

2. **FFmpeg Missing**
   - Railway/Render: Should work automatically
   - Heroku: Add FFmpeg buildpack
   - Docker: Already included in Dockerfile

3. **File Downloads Don't Work**
   - Check file permissions
   - Verify download endpoints are accessible
   - Test CORS settings

4. **Frontend Not Loading**
   - Ensure frontend build completed
   - Check static file serving in backend
   - Verify routing configuration

---

## 📊 Platform Comparison

| Platform | Free Tier | Ease | Performance | Features |
|----------|-----------|------|-------------|----------|
| Railway  | ✅ 500h/mo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Render   | ✅ Limited | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Heroku   | ❌ Paid   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| DigitalOcean | ❌ Paid | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Recommendation: Start with Railway for the best free experience!** 