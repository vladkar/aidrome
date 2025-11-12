/**
 * Custom Init - Main Entry Point
 * Initializes all custom Feishin plugins and modifications
 */

import { AIKeyFieldInjector } from './ai-key-field-injector.js';
import { ContextMenuButton } from './context-menu-button.js';
import { SongFetcher } from './song-fetcher.js';
import { ContextMenuInterceptor } from './context-menu-interceptor.js';
import { PlaylistManager } from './playlist-manager.js';

console.log("🎨 custom-init.js injected");

// Initialize context menu interceptor (captures context menu events)
new ContextMenuInterceptor();

// Initialize AI key field injector (runs independently)
new AIKeyFieldInjector();

// Initialize API test (only runs if authenticated)
new SongFetcher();

// Initialize context menu button
new ContextMenuButton();

// Expose PlaylistManager globally for easy access
window.PlaylistManager = PlaylistManager;

// Add convenient helper functions to window
window.savePlaylist = async (name, songs = null, shouldShuffle = true) => {
  const playlistToSave = songs || window._generatedPlaylist;

  if (!playlistToSave || playlistToSave.length === 0) {
    console.error("❌ No playlist provided and no generated playlist found");
    console.log("💡 Usage: savePlaylist('My Playlist Name')");
    console.log("   Or:    savePlaylist('My Playlist Name', customSongsArray)");
    return { success: false, error: 'No playlist available' };
  }

  return await PlaylistManager.createPlaylist(name, playlistToSave, shouldShuffle);
};

window.savePlaylistUnshuffled = async (name, songs = null) => {
  const playlistToSave = songs || window._generatedPlaylistOriginal;

  if (!playlistToSave || playlistToSave.length === 0) {
    console.error("❌ No playlist provided and no original playlist found");
    console.log("💡 Usage: savePlaylistUnshuffled('My Playlist Name')");
    return { success: false, error: 'No playlist available' };
  }

  return await PlaylistManager.createPlaylist(name, playlistToSave, false);
};

window.analyzePlaylist = (songs = null) => {
  const playlistToAnalyze = songs || window._generatedPlaylist;

  if (!playlistToAnalyze || playlistToAnalyze.length === 0) {
    console.error("❌ No playlist provided and no generated playlist found");
    return null;
  }

  return PlaylistManager.analyzePlaylistDiversity(playlistToAnalyze);
};

window.getPlaylists = async () => {
  return await PlaylistManager.getPlaylists();
};

window.testCreatePlaylist = async () => {
  return await PlaylistManager.testCreatePlaylist();
};

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🎵 PLAYLIST HELPER FUNCTIONS AVAILABLE:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📋 savePlaylist('name')           - Save shuffled playlist");
console.log("📋 savePlaylistUnshuffled('name') - Save in original order");
console.log("📊 analyzePlaylist()              - Analyze diversity");
console.log("📋 getPlaylists()                 - List all playlists");
console.log("🧪 testCreatePlaylist()           - Test API with simple playlist");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

