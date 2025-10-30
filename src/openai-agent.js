/**
 * OpenAI Agent Module
 * Handles communication with OpenAI API
 */

import { AuthUtils } from './auth-utils.js';
import { EncryptionUtils } from './encryption-utils.js';
import { PromptBuilder } from './prompt-builder.js';

export class OpenAIAgent {
  constructor() {
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Get the decrypted OpenAI API key for the current server
   */
  async getApiKey() {
    try {
      const server = AuthUtils.getCurrentServer();
      if (!server?.openaiKeyEncrypted) {
        console.warn("⚠️ No OpenAI API key configured");
        return null;
      }

      const decrypted = await EncryptionUtils.decrypt(
        server.openaiKeyEncrypted,
        server.id,
        server.username
      );

      return decrypted;
    } catch (e) {
      console.error("❌ Error getting API key:", e);
      return null;
    }
  }

  /**
   * Generate a playlist based on context and available songs
   * @param {Object} context - The context information (what was clicked)
   * @param {Array} allSongs - All available songs from the library
   */
  async generatePlaylist(context, allSongs) {
    console.log("🎵 Generating playlist based on context...");

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      console.error("❌ No API key available");
      return null;
    }

    try {
      // Prepare the prompt using PromptBuilder
      const { prompt } = PromptBuilder.buildPrompt(context, allSongs);

      console.log("📝 Sending prompt to OpenAI...");
      console.log("Context type:", context.type);
      console.log("Total songs in library:", allSongs.length);
      console.log("Songs sent to AI:", allSongs.length);
      console.log("Prompt length (chars):", prompt.length);
      console.log("Estimated tokens:", Math.ceil(prompt.length / 4));

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a music curator assistant. Your task is to generate playlists based on user preferences. Return a JSON array of 30-200 song IDs (no more than 200). Return ONLY the JSON array, nothing else.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_completion_tokens: 10000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ OpenAI API error:", error);
        return null;
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || '';

      console.log("✅ OpenAI Response received");
      console.log("Tokens used:", data.usage?.total_tokens);

      // Parse the playlist
      const playlist = this.parsePlaylistResponse(responseText, allSongs);

      if (playlist && playlist.length > 0) {
        console.log("\n🎉 PLAYLIST GENERATED!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`📀 Total songs in playlist: ${playlist.length}`);
        console.table(playlist.slice(0, 20).map(s => ({
          title: s.title,
          artist: s.artist,
          album: s.album,
          year: s.year
        })));

        // Store playlist for later use
        window._generatedPlaylist = playlist;
        console.log("\n💾 Playlist stored in window._generatedPlaylist");

        return playlist;
      } else {
        console.warn("⚠️ No playlist generated");
        return null;
      }

    } catch (e) {
      console.error("❌ Error generating playlist:", e);
      return null;
    }
  }

  /**
   * Parse OpenAI response and map IDs back to full song objects
   */
  parsePlaylistResponse(responseText, allSongs) {
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("❌ No JSON array found in response");
        return null;
      }

      const songIds = JSON.parse(jsonMatch[0]);

      // Create a map for quick lookup
      const songMap = new Map(allSongs.map(s => [s.id, s]));

      // Map IDs to full song objects
      const playlist = songIds
        .map(id => songMap.get(id))
        .filter(Boolean); // Remove any null/undefined entries

      return playlist;
    } catch (e) {
      console.error("❌ Error parsing playlist response:", e);
      return null;
    }
  }

  /**
   * Send a test message to OpenAI
   */
  async sendTestMessage() {
    console.log("🤖 Testing OpenAI API connection...");

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      console.error("❌ No API key available");
      return;
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            {
              role: 'user',
              content: 'Hello! Please respond with a brief greeting.'
            }
          ],
          max_completion_tokens: 100
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ OpenAI API error:", error);
        return;
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message?.content || 'No response';

      console.log("✅ OpenAI API Response:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(message);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Model:", data.model);
      console.log("Tokens used:", data.usage?.total_tokens);

    } catch (e) {
      console.error("❌ Error calling OpenAI API:", e);
    }
  }
}

