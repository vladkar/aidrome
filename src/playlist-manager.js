/**
 * Playlist Manager Module
 * Handles playlist shuffling and saving to Subsonic server
 */

import { AuthUtils } from './auth-utils.js';

export class PlaylistManager {
  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled copy of the array
   */
  static shuffle(array) {
    const shuffled = [...array]; // Create a copy
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Create a new playlist on the Subsonic server
   * @param {string} name - Name of the playlist
   * @param {Array} songs - Array of song objects with id property
   * @param {boolean} shouldShuffle - Whether to shuffle the playlist before saving (default: true)
   * @returns {Promise<Object>} - Result object with success status and playlist info
   */
  static async createPlaylist(name, songs, shouldShuffle = true) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💾 Creating playlist on Subsonic server...");
    console.log(`📝 Playlist name: ${name}`);
    console.log(`🎵 Songs count: ${songs.length}`);
    console.log(`🔀 Shuffle: ${shouldShuffle ? 'Yes' : 'No'}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!songs || songs.length === 0) {
      console.error("❌ No songs provided");
      return { success: false, error: 'No songs provided' };
    }

    // Shuffle if requested
    const finalSongs = shouldShuffle ? this.shuffle(songs) : [...songs];
    console.log(`🔀 Playlist ${shouldShuffle ? 'shuffled' : 'kept in order'}`);

    try {
      const creds = AuthUtils.getCredentials();
      if (!creds) {
        throw new Error("No credentials found");
      }

      // Extract song IDs
      const songIds = finalSongs.map(s => s.id);

      // Build the URL for creating playlist
      // Subsonic API: createPlaylist.view?name=X&songId=Y&songId=Z...
      const params = new URLSearchParams({
        name: name,
        v: '1.13.0',
        c: 'Feishin',
        f: 'json'
      });

      // Add each song ID as a separate parameter
      songIds.forEach(id => params.append('songId', id));

      const url = `${creds.server}/rest/createPlaylist.view?${creds.credential}&${params.toString()}`;

      console.log("📡 Sending request to Subsonic/Navidrome...");
      console.log(`🌐 URL: ${url.substring(0, 200)}...`);
      console.log(`🌐 URL length: ${url.length} chars`);
      console.log(`🎵 Song IDs (first 10):`, songIds.slice(0, 10));

      const response = await fetch(url, {
        method: 'GET'
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ HTTP Error Response:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      console.log("📦 Full API Response:", JSON.stringify(data, null, 2));

      if (data['subsonic-response']?.status === 'ok') {
        const playlistInfo = data['subsonic-response']?.playlist;
        console.log("✅ Playlist created successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`📋 Playlist ID: ${playlistInfo?.id}`);
        console.log(`📝 Name: ${playlistInfo?.name}`);
        console.log(`🎵 Songs: ${playlistInfo?.songCount || songIds.length}`);
        console.log(`⏱️ Duration: ${playlistInfo?.duration ? Math.floor(playlistInfo.duration / 60) + ' minutes' : 'Unknown'}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("💡 Playlist created! It should now appear in your playlists.");
        console.log("💡 If you don't see it, try refreshing the page or navigating to Playlists section.");

        return {
          success: true,
          playlist: playlistInfo,
          songCount: songIds.length
        };
      } else {
        const error = data['subsonic-response']?.error;
        console.error("❌ Subsonic API returned error:", error);
        throw new Error(`Subsonic error: ${error?.message || 'Unknown error'} (code: ${error?.code})`);
      }

    } catch (e) {
      console.error("❌ Error creating playlist:", e);
      return {
        success: false,
        error: e.message
      };
    }
  }

  /**
   * Update an existing playlist on the Subsonic server
   * @param {string} playlistId - ID of the playlist to update
   * @param {string} name - New name for the playlist (optional)
   * @param {Array} songs - New array of song objects (optional)
   * @param {boolean} shouldShuffle - Whether to shuffle before updating (default: true)
   * @returns {Promise<Object>} - Result object with success status
   */
  static async updatePlaylist(playlistId, name = null, songs = null, shouldShuffle = true) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔄 Updating playlist on Subsonic server...");
    console.log(`📋 Playlist ID: ${playlistId}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
      const creds = AuthUtils.getCredentials();
      if (!creds) {
        throw new Error("No credentials found");
      }

      const params = new URLSearchParams({
        playlistId: playlistId,
        v: '1.13.0',
        c: 'Feishin',
        f: 'json'
      });

      // Add name if provided
      if (name) {
        params.append('name', name);
      }

      // Add songs if provided
      if (songs && songs.length > 0) {
        const finalSongs = shouldShuffle ? this.shuffle(songs) : [...songs];
        finalSongs.forEach(song => params.append('songIdToAdd', song.id));
      }

      const url = `${creds.server}/rest/updatePlaylist.view?${creds.credential}&${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data['subsonic-response']?.status === 'ok') {
        console.log("✅ Playlist updated successfully!");
        return { success: true };
      } else {
        const error = data['subsonic-response']?.error;
        throw new Error(`Subsonic error: ${error?.message || 'Unknown error'} (code: ${error?.code})`);
      }

    } catch (e) {
      console.error("❌ Error updating playlist:", e);
      return {
        success: false,
        error: e.message
      };
    }
  }

  /**
   * Get all playlists from the Subsonic server
   * @returns {Promise<Array>} - Array of playlist objects
   */
  static async getPlaylists() {
    try {
      const creds = AuthUtils.getCredentials();
      if (!creds) {
        throw new Error("No credentials found");
      }

      const url = AuthUtils.buildApiUrl('getPlaylists.view');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data['subsonic-response']?.status === 'ok') {
        const playlists = data['subsonic-response']?.playlists?.playlist || [];
        console.log(`📋 Found ${playlists.length} playlists on server`);
        console.table(playlists.map(p => ({
          id: p.id,
          name: p.name,
          songs: p.songCount,
          duration: p.duration ? Math.floor(p.duration / 60) + 'm' : 'N/A'
        })));
        return playlists;
      } else {
        const error = data['subsonic-response']?.error;
        throw new Error(`Subsonic error: ${error?.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error("❌ Error fetching playlists:", e);
      return [];
    }
  }

  /**
   * Try to trigger Feishin to refresh its playlist cache
   * This dispatches events and navigates to force a refresh
   */
  static triggerFeishinRefresh() {
    try {
      // Strategy 1: Dispatch a custom event that Feishin might listen to
      window.dispatchEvent(new CustomEvent('playlist-updated'));
      window.dispatchEvent(new CustomEvent('refetch'));

      // Strategy 2: Try to invalidate React Query cache if accessible
      if (window.queryClient) {
        console.log("🔄 Invalidating React Query cache...");
        window.queryClient.invalidateQueries(['playlists']);
      }

      // Strategy 3: Dispatch storage event to trigger re-render
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'playlist-refresh',
        newValue: Date.now().toString()
      }));

      console.log("🔄 UI refresh triggered - navigate to Playlists to see the new playlist");

    } catch (e) {
      console.log("ℹ️ Auto-refresh not available - manually navigate to Playlists section");
    }
  }

  /**
   * Test creating a simple playlist with just a few songs
   * @returns {Promise<Object>} - Test result
   */
  static async testCreatePlaylist() {
    console.log("🧪 Testing playlist creation with Navidrome...");

    try {
      const creds = AuthUtils.getCredentials();
      if (!creds) {
        throw new Error("No credentials found");
      }

      // Get a few songs from the library to test with
      const url = AuthUtils.buildApiUrl('getRandomSongs.view', { size: 5 });
      const response = await fetch(url);
      const data = await response.json();

      if (data['subsonic-response']?.status !== 'ok') {
        throw new Error("Failed to get test songs");
      }

      const testSongs = data['subsonic-response']?.randomSongs?.song || [];

      if (testSongs.length === 0) {
        throw new Error("No songs available for testing");
      }

      console.log(`🎵 Got ${testSongs.length} test songs:`, testSongs.map(s => s.title));

      // Try creating a playlist
      const result = await this.createPlaylist('Test Playlist ' + Date.now(), testSongs, false);

      if (result.success) {
        console.log("✅ Test PASSED - Playlist creation works!");
        console.log("💡 Now try: await getPlaylists() to verify");
      } else {
        console.log("❌ Test FAILED:", result.error);
      }

      return result;

    } catch (e) {
      console.error("❌ Test error:", e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Analyze playlist diversity (for debugging/validation)
   * @param {Array} songs - Array of song objects
   * @returns {Object} - Diversity statistics
   */
  static analyzePlaylistDiversity(songs) {
    const artistCounts = {};
    const albumCounts = {};

    songs.forEach(song => {
      const artist = song.artist || 'Unknown';
      const album = song.album || 'Unknown';
      const albumKey = `${artist}|||${album}`;

      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
      albumCounts[albumKey] = (albumCounts[albumKey] || 0) + 1;
    });

    const uniqueArtists = Object.keys(artistCounts).length;
    const uniqueAlbums = Object.keys(albumCounts).length;

    const artistsWithMultipleSongs = Object.entries(artistCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    const albumsWithMultipleSongs = Object.entries(albumCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    const stats = {
      totalSongs: songs.length,
      uniqueArtists: uniqueArtists,
      uniqueAlbums: uniqueAlbums,
      averageSongsPerArtist: (songs.length / uniqueArtists).toFixed(2),
      averageSongsPerAlbum: (songs.length / uniqueAlbums).toFixed(2),
      artistsWithMultipleSongs: artistsWithMultipleSongs.length,
      albumsWithMultipleSongs: albumsWithMultipleSongs.length,
      topArtists: artistsWithMultipleSongs.slice(0, 10),
      topAlbums: albumsWithMultipleSongs.slice(0, 10).map(([key, count]) => {
        const [artist, album] = key.split('|||');
        return [`${album} by ${artist}`, count];
      })
    };

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 PLAYLIST DIVERSITY ANALYSIS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🎵 Total songs: ${stats.totalSongs}`);
    console.log(`🎤 Unique artists: ${stats.uniqueArtists} (${(stats.uniqueArtists / stats.totalSongs * 100).toFixed(1)}%)`);
    console.log(`💿 Unique albums: ${stats.uniqueAlbums} (${(stats.uniqueAlbums / stats.totalSongs * 100).toFixed(1)}%)`);
    console.log(`📈 Avg songs per artist: ${stats.averageSongsPerArtist}`);
    console.log(`📈 Avg songs per album: ${stats.averageSongsPerAlbum}`);

    if (stats.topArtists.length > 0) {
      console.log("\n🔝 Top artists by song count:");
      console.table(stats.topArtists.slice(0, 10));
    }

    if (stats.topAlbums.length > 0) {
      console.log("\n🔝 Top albums by song count:");
      console.table(stats.topAlbums.slice(0, 10));
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return stats;
  }
}

