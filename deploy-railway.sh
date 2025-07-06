#!/bin/bash

# Railway Deployment Script for Sound Stream Ripper
echo "🚀 Preparing for Railway deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# Check if we need to add changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Adding changes to git..."
    git add .
    git commit -m "Ready for deployment - $(date)"
fi

echo "✅ Git repository ready!"
echo ""
echo "🚂 Next steps for Railway deployment:"
echo "1. Go to https://railway.app"
echo "2. Sign up/Login with GitHub"
echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
echo "4. Select this repository"
echo "5. Railway will automatically deploy!"
echo ""
echo "📋 Environment variables to set in Railway:"
echo "   NODE_ENV=production"
echo "   PORT=5001"
echo ""
echo "🌐 Your app will be live at: https://your-app-name.up.railway.app"
echo ""
echo "✨ Deployment should take 5-10 minutes!" 