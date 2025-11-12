/**
 * Context Menu Button Module
 * Adds custom button to Feishin's context menu and handles UI integration
 */

import { AuthUtils } from './auth-utils.js';
import { SongFetcher } from './song-fetcher.js';
import { AIAgent } from './ai-agent.js';

export class ContextMenuButton {
  constructor() {
    this.menuSelector = "div._container_1w9l4_1";
    this.customButtonId = "custom-context-button";
    this.currentContext = null; // Store context information
    this.init();
  }

  init() {
    this.startMenuMonitoring();
  }

  /**
   * Create custom context menu button
   */
  createCustomButton() {
    const btn = document.createElement("button");
    btn.className = "_context-menu-button_1w9l4_11";
    btn.id = this.customButtonId;

    btn.innerHTML = `
      <div class="m_4081bf90 mantine-Group-root"
           style="--group-gap: var(--mantine-spacing-md);
                  --group-align: center;
                  --group-justify: space-between;
                  --group-wrap: wrap; width: 100%;">
        <div class="_left_1w9l4_33 m_4081bf90 mantine-Group-root"
             style="--group-gap: var(--mantine-spacing-md);
                    --group-align: center;
                    --group-justify: flex-start;
                    --group-wrap: wrap;">
          <svg stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
               stroke-linecap="round" stroke-linejoin="round"
               class="_fill_89vfq_65 _size-md_89vfq_9"
               height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14m-7-7h14"></path>
          </svg>
          Generate Playlist
        </div>
      </div>
    `;

    btn.addEventListener("click", () => this.handleButtonClick());

    return btn;
  }

  /**
   * Handle custom button click - fetch all songs and generate playlist
   */
  async handleButtonClick() {
    console.log("🪄 Generate Playlist button clicked!");

    if (!AuthUtils.isAuthenticated()) {
      console.error("❌ Not authenticated");
      return;
    }

    try {
      // Use the context captured when menu opened
      const context = this.currentContext || window.feishinContextInterceptor?.getCurrent();
      console.log("📋 Using context:", context);

      // Fetch all songs
      const songFetcher = new SongFetcher();
      const data = await songFetcher.fetchAllSongs();
      songFetcher.storeData(data);

      // Generate playlist using AI
      console.log("\n🤖 Generating playlist with AI...");
      const aiAgent = new AIAgent();
      const playlistSize = 100; // Default playlist size, can be made configurable later
      const playlist = await aiAgent.generatePlaylist(context, data.songs, playlistSize);

      // If playlist was generated successfully, automatically save it
      if (playlist && playlist.length > 0) {
        // Generate playlist name based on context
        const playlistName = this.generatePlaylistName(context);

        console.log(`\n💾 Auto-saving playlist as "${playlistName}"...`);

        // Import PlaylistManager dynamically
        const { PlaylistManager } = await import('./playlist-manager.js');
        const result = await PlaylistManager.createPlaylist(playlistName, playlist, false);

        if (result.success) {
          console.log(`✅ Playlist "${playlistName}" saved successfully!`);
          console.log(`📋 Navigate to Playlists section to see it.`);
        } else {
          console.error(`❌ Failed to save playlist: ${result.error}`);
        }
      }

    } catch (e) {
      console.error("❌ Error in playlist generation process:", e);
    }
  }

  /**
   * Generate a playlist name based on the context
   * @param {Object} context - The context information
   * @returns {string} - Generated playlist name
   */
  generatePlaylistName(context) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const items = context.data || context.items || [];

    switch (context.type) {
      case 'song':
        if (items.length > 0) {
          const song = items[0];
          const title = song.name || song.title || 'Unknown';
          return `AI Mix: ${title} (${dateStr})`;
        }
        break;

      case 'album':
        if (items.length > 0) {
          const album = items[0];
          const albumName = album.name || album.albumName || 'Unknown';
          return `AI Mix: ${albumName} (${dateStr})`;
        }
        break;

      case 'artist':
      case 'albumArtist':
        if (items.length > 0) {
          const artist = items[0];
          const artistName = artist.name || artist.artistName || 'Unknown';
          return `AI Mix: ${artistName} (${dateStr})`;
        }
        break;

      case 'songs':
        return `AI Mix: ${items.length} Songs (${dateStr})`;

      case 'albums':
        return `AI Mix: ${items.length} Albums (${dateStr})`;

      case 'artists':
        return `AI Mix: ${items.length} Artists (${dateStr})`;

      default:
        return `AI Playlist (${dateStr})`;
    }

    return `AI Playlist (${dateStr})`;
  }

  /**
   * Monitor for context menu and inject button
   */
  startMenuMonitoring() {
    // Listen to context capture events
    window.addEventListener('feishin-context-captured', (e) => {
      this.currentContext = e.detail;
    });

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.matches(this.menuSelector)) {
            // Avoid adding multiple times
            if (!node.querySelector(`#${this.customButtonId}`)) {
              const btn = this.createCustomButton();
              node.querySelector(".mantine-Stack-root")?.appendChild(btn);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}


