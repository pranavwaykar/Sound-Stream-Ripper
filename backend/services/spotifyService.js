const axios = require('axios');
const config = require('../config');

class SpotifyService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  validateUrl(url) {
    const spotifyUrlRegex = /^(https?:\/\/)?(open\.)?spotify\.com\/(playlist|track)\/[a-zA-Z0-9]+(\?.*)?$/;
    return spotifyUrlRegex.test(url);
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`).toString('base64');
      
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  async makeSpotifyRequest(url) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Spotify API request error:', error);
      throw new Error('Failed to fetch data from Spotify');
    }
  }

  extractSpotifyId(url) {
    const match = url.match(/\/([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1] : null;
  }

  async getTrackInfo(trackUrl) {
    const trackId = this.extractSpotifyId(trackUrl);
    if (!trackId) {
      throw new Error('Invalid track URL');
    }

    const trackData = await this.makeSpotifyRequest(`https://api.spotify.com/v1/tracks/${trackId}`);
    
    return {
      artist_name: trackData.artists[0].name,
      track_title: trackData.name,
      track_number: trackData.track_number,
      isrc: trackData.external_ids?.isrc || '',
      album_art: trackData.album.images[0]?.url || '',
      album_name: trackData.album.name,
      release_date: trackData.album.release_date,
      artists: trackData.artists.map(artist => artist.name),
      duration_ms: trackData.duration_ms,
      id: trackData.id
    };
  }

  async getPlaylistInfo(playlistUrl) {
    const playlistId = this.extractSpotifyId(playlistUrl);
    if (!playlistId) {
      throw new Error('Invalid playlist URL');
    }

    // Get playlist metadata
    const playlistData = await this.makeSpotifyRequest(`https://api.spotify.com/v1/playlists/${playlistId}`);
    
    if (!playlistData.public) {
      throw new Error("Can't download private playlists. Change your playlist's state to public.");
    }

    // Get all tracks from playlist
    let tracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
    
    while (nextUrl) {
      const tracksData = await this.makeSpotifyRequest(nextUrl);
      tracks = tracks.concat(tracksData.items);
      nextUrl = tracksData.next;
    }

    const tracksInfo = [];
    for (const item of tracks) {
      if (item.track && item.track.type === 'track') {
        const track = item.track;
        tracksInfo.push({
          artist_name: track.artists[0].name,
          track_title: track.name,
          track_number: track.track_number,
          isrc: track.external_ids?.isrc || '',
          album_art: track.album.images[0]?.url || '',
          album_name: track.album.name,
          release_date: track.album.release_date,
          artists: track.artists.map(artist => artist.name),
          duration_ms: track.duration_ms,
          id: track.id
        });
      }
    }

    return {
      playlist_name: playlistData.name,
      tracks: tracksInfo
    };
  }

  async getInfo(url) {
    if (url.includes('/track/')) {
      return { type: 'track', data: await this.getTrackInfo(url) };
    } else if (url.includes('/playlist/')) {
      const playlistInfo = await this.getPlaylistInfo(url);
      return { type: 'playlist', data: playlistInfo.tracks };
    } else {
      throw new Error('Unsupported Spotify URL type');
    }
  }
}

module.exports = new SpotifyService(); 