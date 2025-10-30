/**
 * Context Menu Button Module
 * Adds custom button to Feishin's context menu and handles UI integration
 */

import { AuthUtils } from './auth-utils.js';
import { SongFetcher } from './song-fetcher.js';
import { OpenAIAgent } from './openai-agent.js';
import { ContextDetector } from './context-detector.js';

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
      const context = this.currentContext || ContextDetector.extractContext();
      console.log("📋 Using context:", context);

      // Fetch all songs
      const songFetcher = new SongFetcher();
      const data = await songFetcher.fetchAllSongs();
      songFetcher.storeData(data);

      // Generate playlist using OpenAI
      console.log("\n🤖 Generating playlist with OpenAI...");
      const openaiAgent = new OpenAIAgent();
      await openaiAgent.generatePlaylist(context, data.songs);

    } catch (e) {
      console.error("❌ Error in playlist generation process:", e);
    }
  }

  /**
   * Monitor for context menu and inject button
   */
  startMenuMonitoring() {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.matches(this.menuSelector)) {
            console.log("📋 Context menu detected");

            // Extract context WHEN menu opens, not when button is clicked
            this.currentContext = ContextDetector.extractContext();
            console.log("📋 Context captured:", this.currentContext);

            // Avoid adding multiple times
            if (!node.querySelector(`#${this.customButtonId}`)) {
              const btn = this.createCustomButton();
              node.querySelector(".mantine-Stack-root")?.appendChild(btn);
              console.log("✅ Custom button added to context menu");
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}

