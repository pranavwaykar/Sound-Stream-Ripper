const youtubeDl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const NodeID3 = require('node-id3');
const ffmpeg = require('fluent-ffmpeg');
const spotifyService = require('./spotifyService');
const youtubeSearch = require('youtube-search-api');

class DownloadService {
  constructor() {
    // Set ffmpeg path if needed (you might need to install ffmpeg separately)
    // ffmpeg.setFfmpegPath('/path/to/ffmpeg');
    
    // Configure youtube-dl-exec to use system yt-dlp
    this.ytDlpOptions = {
      binaryPath: '/opt/homebrew/bin/yt-dlp' // Use system yt-dlp instead of bundled
    };
  }

  async searchYoutube(query) {
    try {
      console.log(`Searching YouTube for: ${query}`);
      
      // Use youtube-search-api for better results
      const results = await youtubeSearch.GetListByKeyword(query, false, 5);
      
      if (!results.items || results.items.length === 0) {
        throw new Error(`No YouTube videos found for: ${query}`);
      }
      
      // Get the first video that's not a live stream or shorts
      const video = results.items.find(item => 
        item.type === 'video' && 
        !item.isLive && 
        item.length && 
        item.length.simpleText !== 'LIVE'
      ) || results.items[0];
      
      if (!video) {
        throw new Error(`No suitable YouTube videos found for: ${query}`);
      }
      
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      console.log(`Found video: ${video.title} - ${videoUrl}`);
      
      return videoUrl;
    } catch (error) {
      console.error('YouTube search error:', error);
      
      // Fallback to simple URL construction
      const searchQuery = encodeURIComponent(query);
      const fallbackUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
      
      try {
        const response = await axios.get(fallbackUrl);
        const html = response.data;
        
        // Extract video IDs from the HTML
        const videoIdRegex = /"videoId":"([^"]+)"/g;
        const matches = [];
        let match;
        
        while ((match = videoIdRegex.exec(html)) !== null && matches.length < 5) {
          matches.push(match[1]);
        }
        
        if (matches.length === 0) {
          throw new Error(`No YouTube videos found for: ${query}`);
        }
        
        return `https://www.youtube.com/watch?v=${matches[0]}`;
      } catch (fallbackError) {
        throw new Error(`Failed to search YouTube for: ${query}`);
      }
    }
  }

  async downloadFromYoutube(youtubeUrl, outputPath, trackInfo) {
    return new Promise(async (resolve, reject) => {
      try {
        // Sanitize filename
        const sanitizedTitle = this.sanitizeFilename(`${trackInfo.artist_name} - ${trackInfo.track_title}`);
        const finalFilePath = path.join(outputPath, `${sanitizedTitle}.mp3`);
        
        // Check if file already exists
        if (fs.existsSync(finalFilePath)) {
          return resolve({ skipped: true, filePath: finalFilePath });
        }

        console.log(`Downloading: ${youtubeUrl}`);
        
        // Use absolute path for output to avoid path issues
        const absoluteOutputPath = path.resolve(outputPath);
        const outputTemplate = path.join(absoluteOutputPath, `${sanitizedTitle}.%(ext)s`);
        
        // Download using youtube-dl-exec with system yt-dlp
        const output = await youtubeDl(youtubeUrl, {
          extractAudio: true,
          audioFormat: 'mp3',
          audioQuality: 0, // Best quality
          output: outputTemplate,
          restrictFilenames: true,
          noCheckCertificate: true,
          noWarnings: true,
          preferFreeFormats: true,
          addHeader: [
            'referer:youtube.com',
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          ]
        }, this.ytDlpOptions);

        console.log('Download completed:', output);
        resolve({ skipped: false, filePath: finalFilePath });

      } catch (error) {
        console.error('Download error:', error);
        
        // Fallback: try with simpler options
        try {
          console.log('Trying fallback download method...');
          
          const sanitizedTitle = this.sanitizeFilename(`${trackInfo.artist_name} - ${trackInfo.track_title}`);
          const absoluteOutputPath = path.resolve(outputPath);
          const tempOutputTemplate = path.join(absoluteOutputPath, `temp_${Date.now()}.%(ext)s`);
          const finalFilePath = path.join(outputPath, `${sanitizedTitle}.mp3`);
          
          await youtubeDl(youtubeUrl, {
            format: 'bestaudio',
            output: tempOutputTemplate,
            noCheckCertificate: true,
            noWarnings: true
          }, this.ytDlpOptions);
          
          // Find the downloaded file
          const files = fs.readdirSync(absoluteOutputPath);
          const downloadedFile = files.find(file => file.startsWith(`temp_${Date.now().toString().slice(0, -3)}`));
          
          if (downloadedFile) {
            const inputFile = path.join(absoluteOutputPath, downloadedFile);
            
            // Convert to MP3 using ffmpeg
            ffmpeg(inputFile)
              .toFormat('mp3')
              .audioBitrate(320)
              .on('error', (ffmpegError) => {
                console.error('FFmpeg error:', ffmpegError);
                // Clean up temp file
                try {
                  if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
                } catch (e) {}
                reject(new Error('Failed to convert audio to MP3'));
              })
              .on('end', () => {
                // Clean up temp file
                try {
                  if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
                } catch (e) {}
                resolve({ skipped: false, filePath: finalFilePath });
              })
              .save(finalFilePath);
          } else {
            reject(new Error('Downloaded file not found'));
          }
            
        } catch (fallbackError) {
          console.error('Fallback download also failed:', fallbackError);
          reject(new Error(`Failed to download from YouTube: ${error.message}`));
        }
      }
    });
  }

  sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
  }

  async setMetadata(filePath, trackInfo) {
    try {
      const tags = {
        title: trackInfo.track_title,
        artist: trackInfo.artist_name,
        album: trackInfo.album_name,
        year: trackInfo.release_date?.split('-')[0] || '',
        trackNumber: trackInfo.track_number?.toString() || '',
        ISRC: trackInfo.isrc || ''
      };

      // Download and add album art if available
      if (trackInfo.album_art) {
        try {
          const imageResponse = await axios.get(trackInfo.album_art, {
            responseType: 'arraybuffer',
            timeout: 10000
          });
          tags.image = {
            mime: 'image/jpeg',
            type: {
              id: 3,
              name: 'front cover'
            },
            description: 'Cover',
            imageBuffer: Buffer.from(imageResponse.data)
          };
        } catch (imageError) {
          console.warn('Failed to download album art:', imageError.message);
        }
      }

      const success = NodeID3.write(tags, filePath);
      if (!success) {
        console.warn('Failed to write metadata to file:', filePath);
      } else {
        console.log('Metadata written successfully for:', path.basename(filePath));
      }
    } catch (error) {
      console.error('Metadata error:', error);
      // Don't throw error for metadata issues, file is still usable
    }
  }

  async processDownload(downloadId, url, downloadPath, fileExistsAction, downloads) {
    const downloadState = downloads.get(downloadId);
    
    try {
      // Create download directory if it doesn't exist
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }

      downloadState.message = 'Fetching track information from Spotify...';
      downloads.set(downloadId, downloadState);

      // Get track/playlist info from Spotify
      const spotifyInfo = await spotifyService.getInfo(url);
      const tracks = spotifyInfo.type === 'track' ? [spotifyInfo.data] : spotifyInfo.data;
      
      downloadState.total = tracks.length;
      downloadState.log.push(`Found ${tracks.length} track(s) to download`);
      downloads.set(downloadId, downloadState);

      const startTime = Date.now();
      let downloadedCount = 0;

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        
        try {
          const searchQuery = `${track.artist_name} ${track.track_title} audio`;
          
          downloadState.message = `Searching YouTube for: ${track.artist_name} - ${track.track_title}`;
          downloadState.log.push(`(${i + 1}/${tracks.length}) Finding: ${track.artist_name} - ${track.track_title}`);
          downloads.set(downloadId, downloadState);

          // Search YouTube
          const youtubeUrl = await this.searchYoutube(searchQuery);
          
          downloadState.message = `Downloading: ${track.artist_name} - ${track.track_title}`;
          downloads.set(downloadId, downloadState);

          // Download from YouTube
          const result = await this.downloadFromYoutube(youtubeUrl, downloadPath, track);
          
          if (result.skipped) {
            downloadState.log.push(`Skipped: ${track.artist_name} - ${track.track_title} (already exists)`);
          } else {
            downloadState.message = `Setting metadata for: ${track.track_title}`;
            downloads.set(downloadId, downloadState);
            
            // Set metadata
            await this.setMetadata(result.filePath, track);
            
            downloadState.log.push(`✓ Downloaded: ${track.artist_name} - ${track.track_title}`);
            downloadedCount++;
          }

          downloadState.completed = downloadedCount;
          downloadState.progress = Math.round(((i + 1) / tracks.length) * 100);
          downloads.set(downloadId, downloadState);

        } catch (error) {
          const errorMsg = `Error downloading ${track.track_title}: ${error.message}`;
          console.error(errorMsg);
          downloadState.log.push(errorMsg);
          downloadState.errors.push(errorMsg);
          downloads.set(downloadId, downloadState);
        }
      }

      const endTime = Date.now();
      const timeTaken = Math.round((endTime - startTime) / 1000);

      downloadState.status = 'completed';
      downloadState.message = `Download completed. ${downloadedCount}/${tracks.length} songs downloaded in ${timeTaken} seconds`;
      downloads.set(downloadId, downloadState);

    } catch (error) {
      console.error('Process download error:', error);
      downloadState.status = 'error';
      downloadState.message = `Error: ${error.message}`;
      downloadState.errors.push(error.message);
      downloads.set(downloadId, downloadState);
    }
  }
}

module.exports = new DownloadService(); 