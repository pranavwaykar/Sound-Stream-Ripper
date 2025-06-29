# Deployment Guide

This guide covers different deployment options for the Sound Stream Ripper application.

## Prerequisites

Before deploying, ensure you have:

1. **Spotify API Credentials**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Get your Client ID and Client Secret

2. **System Dependencies** (for self-hosted deployments)
   - Node.js 16+
   - FFmpeg
   - yt-dlp

## Deployment Options

### 1. Heroku (Recommended for beginners)

Heroku is the easiest platform to deploy to with minimal configuration.

#### Quick Deploy Button
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

#### Manual Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Or download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

4. **Add Buildpacks**
   ```bash
   heroku buildpacks:add heroku/nodejs
   heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
   heroku buildpacks:add https://github.com/ArmindoFlores/heroku-buildpack-yt-dlp.git
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SPOTIFY_CLIENT_ID=your_spotify_client_id
   heroku config:set SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

6. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

7. **Open Your App**
   ```bash
   heroku open
   ```

### 2. Railway

Railway is a modern alternative to Heroku with better performance.

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set SPOTIFY_CLIENT_ID=your_spotify_client_id
   railway variables set SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

### 3. Vercel

Vercel is great for frontend but requires some configuration for full-stack apps.

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Environment Variables**
   - Go to your Vercel dashboard
   - Add environment variables:
     - `NODE_ENV=production`
     - `SPOTIFY_CLIENT_ID=your_spotify_client_id`
     - `SPOTIFY_CLIENT_SECRET=your_spotify_client_secret`

### 4. DigitalOcean App Platform

1. **Create Account** at [DigitalOcean](https://cloud.digitalocean.com)

2. **Create New App**
   - Connect your GitHub repository
   - Choose Node.js as the build pack
   - Set environment variables

3. **Configure Build Settings**
   - Build Command: `npm run deploy:setup`
   - Run Command: `npm start`

### 5. Docker Deployment

For self-hosted deployment using Docker.

1. **Build Docker Image**
   ```bash
   docker build -t sound-stream-ripper .
   ```

2. **Run with Docker Compose**
   ```bash
   # Create .env file
   echo "SPOTIFY_CLIENT_ID=your_client_id" > .env
   echo "SPOTIFY_CLIENT_SECRET=your_client_secret" >> .env
   
   # Start the application
   docker-compose up -d
   ```

3. **Or Run Docker Container Directly**
   ```bash
   docker run -d \
     -p 5001:5001 \
     -e NODE_ENV=production \
     -e SPOTIFY_CLIENT_ID=your_client_id \
     -e SPOTIFY_CLIENT_SECRET=your_client_secret \
     -v $(pwd)/downloads:/app/backend/downloads \
     sound-stream-ripper
   ```

### 6. Self-Hosted (VPS/Server)

For deployment on your own server or VPS.

1. **Server Requirements**
   - Ubuntu 20.04+ or similar Linux distribution
   - Node.js 16+
   - Nginx (optional, for reverse proxy)
   - PM2 (for process management)

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install system dependencies
   sudo apt install -y ffmpeg python3-pip git
   
   # Install yt-dlp
   pip3 install yt-dlp
   
   # Install PM2
   sudo npm install -g pm2
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/sound-stream-ripper.git
   cd sound-stream-ripper
   
   # Install dependencies and build
   npm run deploy:setup
   
   # Create environment file
   cat > .env << EOF
   NODE_ENV=production
   PORT=5001
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   EOF
   
   # Start with PM2
   pm2 start backend/server.js --name "sound-stream-ripper"
   pm2 startup
   pm2 save
   ```

4. **Configure Nginx (Optional)**
   ```bash
   sudo nano /etc/nginx/sites-available/sound-stream-ripper
   ```
   
   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sound-stream-ripper /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Environment Variables

Required environment variables for all deployments:

- `NODE_ENV=production`
- `SPOTIFY_CLIENT_ID=your_spotify_client_id`
- `SPOTIFY_CLIENT_SECRET=your_spotify_client_secret`

Optional environment variables:

- `PORT=5001` (default port)
- `FRONTEND_URL=https://your-app.com` (for CORS in production)

## Post-Deployment Checklist

1. ✅ Application starts without errors
2. ✅ Health check endpoint works: `GET /api/health`
3. ✅ Frontend loads correctly
4. ✅ Spotify API integration works
5. ✅ Download functionality works
6. ✅ File downloads work
7. ✅ Environment variables are set correctly

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure all dependencies are installed
   - Check Node.js version compatibility
   - Verify environment variables are set

2. **Spotify API Errors**
   - Verify Client ID and Secret are correct
   - Check if your Spotify app has proper permissions

3. **Download Failures**
   - Ensure yt-dlp is installed and accessible
   - Check FFmpeg installation
   - Verify internet connectivity

4. **Memory Issues**
   - Increase memory allocation on your hosting platform
   - Consider using a more powerful hosting plan

### Logs and Debugging

- **Heroku**: `heroku logs --tail`
- **Railway**: `railway logs`
- **Docker**: `docker logs <container_id>`
- **PM2**: `pm2 logs sound-stream-ripper`

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to git
2. **HTTPS**: Use HTTPS in production
3. **Rate Limiting**: Consider adding rate limiting for API endpoints
4. **File Storage**: Implement proper file cleanup for downloads
5. **CORS**: Configure CORS properly for your domain

## Performance Optimization

1. **CDN**: Use a CDN for static assets
2. **Caching**: Implement Redis for download state management
3. **Load Balancing**: Use multiple instances for high traffic
4. **Database**: Consider using a database instead of in-memory storage

---

## Quick Start Commands

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run deploy:setup
npm start
```

### Docker
```bash
docker-compose up -d
```

### Heroku
```bash
git push heroku main
```

---

**Need help?** Check the [README.md](README.md) for more information or create an issue on GitHub. 