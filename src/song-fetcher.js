/**
 * Song Fetcher Module
 * Handles fetching all songs from the Subsonic server with efficient batching
 */

import { AuthUtils } from './auth-utils.js';

export class SongFetcher {
  constructor() {
    this.batchSize = 500;
    this.parallelRequests = 500;
  }

  /**
   * Fetch all songs from the server
   * @returns {Promise<Object>} Object containing artists, albums, songs, and fetch time
   */
  async fetchAllSongs() {
    const creds = AuthUtils.getCredentials();
    if (!creds) {
      throw new Error("No credentials found");
    }

    const { server, credential } = creds;
    const startTime = Date.now();

    console.log("🚀 Starting song fetch process...");

    try {
      // Step 1: Fetch all artists
      const artists = await this.fetchArtists();
      console.log(`✅ Found ${artists.length} artists`);

      if (artists.length === 0) {
        console.warn("⚠️ No artists found");
        return { artists: [], albums: [], songs: [], fetchTime: 0 };
      }

      // Step 2: Fetch all albums
      const albums = await this.fetchAllAlbums(server, credential);
      console.log(`✅ Total albums found: ${albums.length}`);

      // Step 3: Fetch songs for all albums
      const songs = await this.fetchSongsForAlbums(albums, server, credential);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      // Log results
      this.logResults(artists, albums, songs, duration);

      return {
        artists,
        albums,
        songs,
        fetchTime: duration
      };

    } catch (e) {
      console.error("❌ Error fetching songs:", e);
      throw e;
    }
  }

  /**
   * Fetch all artists from the server
   */
  async fetchArtists() {
    console.log("📊 Fetching artists list...");
    const url = AuthUtils.buildApiUrl('getArtists.view');
    const response = await fetch(url);
    const data = await response.json();

    return data["subsonic-response"]?.artists?.index?.flatMap(i => i.artist || []) || [];
  }

  /**
   * Fetch all albums from the server using batching
   */
  async fetchAllAlbums(server, credential) {
    console.log("📊 Fetching all albums...");
    const albums = [];
    let offset = 0;

    while (true) {
      const albumUrl = `${server}/rest/getAlbumList2.view?${credential}&v=1.13.0&c=Feishin&f=json&type=alphabeticalByName&size=${this.batchSize}&offset=${offset}`;
      const albumResp = await fetch(albumUrl);
      const albumData = await albumResp.json();
      const batch = albumData["subsonic-response"]?.albumList2?.album || [];

      if (batch.length === 0) break;

      albums.push(...batch);
      offset += batch.length;
      console.log(`📊 Progress: ${offset} albums fetched...`);

      if (batch.length < this.batchSize) break; // Last batch
    }

    return albums;
  }

  /**
   * Fetch songs for all albums using parallel batching
   */
  async fetchSongsForAlbums(albums, server, credential) {
    console.log("📊 Fetching songs for albums...");
    const allSongs = [];
    let albumsFetched = 0;

    for (let i = 0; i < albums.length; i += this.parallelRequests) {
      const albumBatch = albums.slice(i, i + this.parallelRequests);

      const songPromises = albumBatch.map(async (album) => {
        const songUrl = `${server}/rest/getAlbum.view?${credential}&v=1.13.0&c=Feishin&f=json&id=${album.id}`;
        const songResp = await fetch(songUrl);
        const songData = await songResp.json();
        return songData["subsonic-response"]?.album?.song || [];
      });

      const batchResults = await Promise.all(songPromises);
      batchResults.forEach(songs => allSongs.push(...songs));

      albumsFetched += albumBatch.length;
      const progress = ((albumsFetched / albums.length) * 100).toFixed(1);
      console.log(`📊 Progress: ${albumsFetched}/${albums.length} albums processed (${progress}%) - ${allSongs.length} songs so far...`);
    }

    return allSongs;
  }

  /**
   * Log fetch results to console
   */
  logResults(artists, albums, songs, duration) {
    console.log(`\n🎉 FETCH COMPLETE!`);
    console.log(`⏱️ Time taken: ${duration} seconds`);
    console.log(`🎵 Total songs found: ${songs.length}`);
    console.log(`📀 Total albums: ${albums.length}`);
    console.log(`🎤 Total artists: ${artists.length}`);
    console.log(`\n📋 Sample songs (first 100):`);
    console.table(
      songs.slice(0, 100).map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
        year: s.year
      }))
    );
  }

  /**
   * Store fetched data in window for later use
   */
  storeData(data) {
    window._customPluginData = data;
    console.log(`\n💾 Data stored in window._customPluginData for next stages`);
  }
}

