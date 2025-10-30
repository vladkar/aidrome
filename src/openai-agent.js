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
      // Filter songs to a manageable subset based on context
      const relevantSongs = this.filterRelevantSongs(context, allSongs);
      console.log(`🎯 Filtered to ${relevantSongs.length} relevant songs (from ${allSongs.length} total)`);

      // Prepare the prompt using PromptBuilder
      const { prompt } = PromptBuilder.buildPrompt(context, relevantSongs);

      console.log("📝 Sending prompt to OpenAI...");
      console.log("Context type:", context.type);
      console.log("Total songs in library:", allSongs.length);
      console.log("Songs sent to AI:", relevantSongs.length);
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
   * Filter songs to a manageable subset based on context
   * Limits to ~8000 songs max to stay under gpt-5-mini's 500k token limit
   */
  filterRelevantSongs(context, allSongs) {
    const MAX_SONGS = 8000; // Safe limit for gpt-5-mini (500k TPM)

    // If library is small enough, use all songs
    if (allSongs.length <= MAX_SONGS) {
      return allSongs;
    }

    let filtered = [];

    switch (context.type) {
      case 'song':
        // Filter by artist and similar years
        const song = context.items[0];
        const artistSongs = allSongs.filter(s => s.artist === song.artist);
        const yearRange = song.year ? [song.year - 10, song.year + 10] : null;
        const sameEra = yearRange ? allSongs.filter(s => s.year >= yearRange[0] && s.year <= yearRange[1]) : [];

        // Combine and deduplicate
        filtered = [...new Set([...artistSongs, ...sameEra])];
        break;

      case 'songs':
        // Get all artists from selected songs
        const artists = [...new Set(context.items.map(s => s.artist))];
        filtered = allSongs.filter(s => artists.includes(s.artist));
        break;

      case 'album':
      case 'albums':
        // Filter by artist name if available
        if (context.artistName) {
          filtered = allSongs.filter(s => s.artist === context.artistName);
        } else if (context.items) {
          // For multiple albums, we don't have full artist info from cards
          // Just use all songs for now
          filtered = allSongs;
        }
        break;

      case 'artist':
      case 'artists':
        // Get all songs by this artist
        if (context.artistName) {
          filtered = allSongs.filter(s => s.artist === context.artistName);
        } else if (context.items) {
          // For multiple artists, filter by all artist names
          const artistNames = context.items.map(a => a.artistName);
          filtered = allSongs.filter(s => artistNames.includes(s.artist));
        }
        break;

      default:
        // Random sample for general case
        filtered = [];
        break;
    }

    // If still too many, take a random sample
    if (filtered.length > MAX_SONGS) {
      // Shuffle and take first MAX_SONGS
      filtered = filtered.sort(() => Math.random() - 0.5).slice(0, MAX_SONGS);
    }

    // If we don't have enough context-specific songs, add random samples
    if (filtered.length < MAX_SONGS / 2) {
      const remaining = MAX_SONGS - filtered.length;
      const filteredIds = new Set(filtered.map(s => s.id));
      const otherSongs = allSongs.filter(s => !filteredIds.has(s.id));
      const randomSample = otherSongs.sort(() => Math.random() - 0.5).slice(0, remaining);
      filtered = [...filtered, ...randomSample];
    }

    return filtered;
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

