/**
 * AI Agent Module
 * Handles communication with AI APIs (OpenAI, Claude)
 * Provider is configured per-server
 */

import { AuthUtils } from './auth-utils.js';
import { EncryptionUtils } from './encryption-utils.js';
import { PromptBuilder } from './prompt-builder.js';
import { PlaylistManager } from './playlist-manager.js';

export class AIAgent {
  constructor() {
    // ⚠️ CORS PROXY CONFIGURATION
    // AI APIs block browser requests due to CORS policy.
    // Options:
    // 1. Use a CORS proxy (FOR TESTING ONLY - not secure for production)
    // 2. Set up your own backend server to forward API requests
    // 3. Use browser extensions to disable CORS (NOT RECOMMENDED)

    // Set to true to use CORS proxy (TESTING ONLY)
    this.useCorsProxy = true;
    this.corsProxy = 'https://corsproxy.io/?';

    this.providers = {
      openai: {
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-5-mini',
        maxTokens: 500000,
        formatRequest: this.formatOpenAIRequest.bind(this),
        parseResponse: this.parseOpenAIResponse.bind(this)
      },
      claude: {
        name: 'Anthropic Claude',
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-sonnet-4-5',
        maxTokens: 500000,
        formatRequest: this.formatClaudeRequest.bind(this),
        parseResponse: this.parseClaudeResponse.bind(this)
      }
    };
  }

  /**
   * Wrap URL with CORS proxy if enabled
   */
  wrapWithProxy(url) {
    if (this.useCorsProxy) {
      console.warn("⚠️ Using CORS proxy - THIS IS FOR TESTING ONLY!");
      console.warn("⚠️ For production, set up a proper backend server!");
      return this.corsProxy + encodeURIComponent(url);
    }
    return url;
  }

  /**
   * Get the current AI provider configuration
   */
  getProvider() {
    try {
      const server = AuthUtils.getCurrentServer();
      const providerName = server?.aiProvider || 'openai';
      return this.providers[providerName] || this.providers.openai;
    } catch (e) {
      console.error("❌ Error getting provider:", e);
      return this.providers.openai;
    }
  }

  /**
   * Get the provider name
   */
  getProviderName() {
    try {
      const server = AuthUtils.getCurrentServer();
      console.log("🔍 Reading provider from server object:", {
        serverId: server?.id?.substring(0, 8),
        aiProvider: server?.aiProvider,
        hasAiKey: !!server?.aiKeyEncrypted,
        fullServer: server
      });
      return server?.aiProvider || 'openai';
    } catch (e) {
      console.error("❌ Error getting provider name:", e);
      return 'openai';
    }
  }

  /**
   * Get the decrypted AI API key for the current server
   */
  async getApiKey() {
    try {
      const server = AuthUtils.getCurrentServer();

      if (!server?.aiKeyEncrypted) {
        console.warn("⚠️ No AI API key configured");
        return null;
      }

      const decrypted = await EncryptionUtils.decrypt(
        server.aiKeyEncrypted,
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
   * Get the system message for both providers
   */
  getSystemMessage() {
    return 'You are a music curator assistant. Your task is to generate playlists based on user preferences. Return a JSON array of 30-200 song IDs (no more than 200). Return ONLY the JSON array, nothing else.';
  }

  /**
   * Format request for OpenAI API
   */
  formatOpenAIRequest(prompt, apiKey) {
    return {
      url: this.providers.openai.endpoint,  // No proxy needed - OpenAI works directly
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.providers.openai.model,
          messages: [
            {
              role: 'user',
              content: `${this.getSystemMessage()}\n\n${prompt}`
            }
          ],
          max_completion_tokens: 100000
        })
      }
    };
  }

  /**
   * Format request for Claude API
   */
  formatClaudeRequest(prompt, apiKey) {
    return {
      url: this.wrapWithProxy(this.providers.claude.endpoint),
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.providers.claude.model,
          max_tokens: 8000,
          system: this.getSystemMessage(),
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      }
    };
  }

  /**
   * Parse response from OpenAI API
   */
  parseOpenAIResponse(data) {
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens
    };
  }

  /**
   * Parse response from Claude API
   */
  parseClaudeResponse(data) {
    return {
      content: data.content?.[0]?.text || '',
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens
    };
  }

  /**
   * Generate a playlist based on context and available songs
   * @param {Object} context - The context information (what was clicked)
   * @param {Array} allSongs - All available songs from the library
   * @param {number} playlistSize - Target number of songs for the playlist (default: 100)
   */
  async generatePlaylist(context, allSongs, playlistSize = 100) {
    const provider = this.getProvider();
    const providerName = this.getProviderName();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🎵 Generating playlist using ${provider.name}...`);
    console.log(`📡 Provider: ${providerName}`);
    console.log(`🤖 Model: ${provider.model}`);
    console.log(`🌐 Endpoint: ${provider.endpoint}`);
    console.log(`🎯 Target playlist size: ${playlistSize} songs`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

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
      const { prompt } = PromptBuilder.buildPrompt(context, relevantSongs, playlistSize);

      console.log("📝 Sending prompt to AI...");
      console.log("Provider:", provider.name);
      console.log("Model:", provider.model);
      console.log("Context type:", context.type);
      console.log("Total songs in library:", allSongs.length);
      console.log("Songs sent to AI:", relevantSongs.length);
      console.log("Prompt length (chars):", prompt.length);
      console.log("Estimated tokens:", Math.ceil(prompt.length / 4));

      // Format request based on provider
      const { url, options } = provider.formatRequest(prompt, apiKey);

      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ ${provider.name} API error:`, error);
        console.error(`❌ Status: ${response.status} ${response.statusText}`);
        console.error(`❌ Request URL: ${url}`);
        console.error(`❌ Request headers:`, options.headers);
        console.error(`❌ Request body:`, options.body);
        return null;
      }

      const data = await response.json();

      console.log("🔍 Raw API response structure:", JSON.stringify(data, null, 2).substring(0, 3000));
      console.log("🔍 Response data.choices:", data.choices);
      console.log("🔍 Response data.choices[0]:", data.choices?.[0]);
      console.log("🔍 Response data.choices[0].message:", data.choices?.[0]?.message);
      console.log("🔍 Response data.choices[0].message.content:", data.choices?.[0]?.message?.content);

      const { content: responseText, tokensUsed } = provider.parseResponse(data);

      console.log(`✅ ${provider.name} Response received`);
      console.log("Tokens used:", tokensUsed);
      console.log("Response text length:", responseText?.length || 0);
      console.log("Response text type:", typeof responseText);
      console.log("Response text preview:", responseText?.substring(0, 500) || "(empty)");

      // Parse the playlist
      const playlist = this.parsePlaylistResponse(responseText, allSongs);

      if (playlist && playlist.length > 0) {
        console.log("\n🎉 PLAYLIST GENERATED!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`📀 Total songs in playlist: ${playlist.length}`);

        // Analyze diversity BEFORE shuffling
        const diversityStats = PlaylistManager.analyzePlaylistDiversity(playlist);

        console.table(playlist.slice(0, 20).map(s => ({
          title: s.title,
          artist: s.artist,
          album: s.album,
          year: s.year
        })));

        // Shuffle the playlist on client side
        const shuffledPlaylist = PlaylistManager.shuffle(playlist);
        console.log("\n🔀 Playlist shuffled on client side");

        // Store both versions for later use
        window._generatedPlaylist = shuffledPlaylist; // Default to shuffled
        window._generatedPlaylistOriginal = playlist; // Keep original order
        window._playlistDiversityStats = diversityStats;
        console.log("\n💾 Playlists stored:");
        console.log("   - window._generatedPlaylist (shuffled)");
        console.log("   - window._generatedPlaylistOriginal (original order)");
        console.log("   - window._playlistDiversityStats (diversity analysis)");

        return shuffledPlaylist;
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
   * Limits to ~8000 songs max to stay under token limits
   */
  filterRelevantSongs(context, allSongs) {
    const MAX_SONGS = 8000; // Safe limit for most models

    // If library is small enough, use all songs
    if (allSongs.length <= MAX_SONGS) {
      return allSongs;
    }

    let filtered = [];
    const items = context.data || context.items || []; // Support both data and items properties

    switch (context.type) {
      case 'song':
        // Filter by artist and similar years
        if (items.length === 0) break;
        const song = items[0];
        const songArtist = song.artistItems?.[0]?.name || song.artists?.[0]?.name || song.artist;
        const artistSongs = allSongs.filter(s => s.artist === songArtist);
        const yearRange = song.year ? [song.year - 10, song.year + 10] : null;
        const sameEra = yearRange ? allSongs.filter(s => s.year >= yearRange[0] && s.year <= yearRange[1]) : [];

        // Combine and deduplicate
        filtered = [...new Set([...artistSongs, ...sameEra])];
        break;

      case 'songs':
        // Get all artists from selected songs
        if (items.length === 0) break;
        const artists = [...new Set(items.map(s => s.artistItems?.[0]?.name || s.artists?.[0]?.name || s.artist))];
        filtered = allSongs.filter(s => artists.includes(s.artist));
        break;

      case 'album':
      case 'albums':
        // Filter by artist name if available
        if (items.length > 0) {
          const albumArtists = items.map(a => a.albumArtists?.[0]?.name).filter(Boolean);
          if (albumArtists.length > 0) {
            filtered = allSongs.filter(s => albumArtists.includes(s.artist));
          } else {
            filtered = allSongs;
          }
        } else {
          filtered = allSongs;
        }
        break;

      case 'artist':
      case 'artists':
      case 'albumArtist':
        // Get all songs by this artist
        if (items.length > 0) {
          const artistNames = items.map(a => a.name).filter(Boolean);
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
   * Parse AI response and map IDs back to full song objects
   */
  parsePlaylistResponse(responseText, allSongs) {
    try {
      console.log("🔍 Parsing AI response...");
      console.log("Full response text:", responseText);

      // Try multiple strategies to extract JSON array
      let jsonText = null;

      // Strategy 1: Look for JSON in markdown code blocks
      const codeBlockMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (codeBlockMatch) {
        console.log("📝 Found JSON in markdown code block");
        jsonText = codeBlockMatch[1];
      }

      // Strategy 2: Look for raw JSON array
      if (!jsonText) {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          console.log("📝 Found raw JSON array");
          jsonText = jsonMatch[0];
        }
      }

      // Strategy 3: Try parsing the entire response as JSON
      if (!jsonText) {
        console.log("📝 Attempting to parse entire response as JSON");
        jsonText = responseText.trim();
      }

      if (!jsonText) {
        console.error("❌ No JSON array found in response");
        console.error("Response text:", responseText.substring(0, 1000));
        return null;
      }

      console.log("🔧 Attempting to parse JSON...");
      console.log("JSON text preview:", jsonText.substring(0, 500));

      const songIds = JSON.parse(jsonText);

      if (!Array.isArray(songIds)) {
        console.error("❌ Parsed JSON is not an array");
        return null;
      }

      console.log(`✅ Parsed ${songIds.length} song IDs`);

      // Create a map for quick lookup
      const songMap = new Map(allSongs.map(s => [s.id, s]));

      // Map IDs to full song objects
      const playlist = songIds
        .map(id => songMap.get(id))
        .filter(Boolean); // Remove any null/undefined entries

      console.log(`✅ Mapped ${playlist.length} valid songs (${songIds.length - playlist.length} IDs not found)`);

      return playlist;
    } catch (e) {
      console.error("❌ Error parsing playlist response:", e);
      console.error("Response text:", responseText.substring(0, 1000));
      return null;
    }
  }

  /**
   * Save a playlist to Subsonic server
   * @param {string} name - Name for the playlist
   * @param {Array} songs - Array of song objects
   * @param {boolean} shouldShuffle - Whether to shuffle before saving (default: true)
   * @returns {Promise<Object>} - Result from PlaylistManager.createPlaylist
   */
  async savePlaylist(name, songs, shouldShuffle = true) {
    console.log("🎵 Saving playlist via AIAgent...");
    return await PlaylistManager.createPlaylist(name, songs, shouldShuffle);
  }

  /**
   * Save the last generated playlist to Subsonic server
   * @param {string} name - Name for the playlist
   * @param {boolean} useOriginalOrder - Use original (unshuffled) order (default: false)
   * @returns {Promise<Object>} - Result from PlaylistManager.createPlaylist
   */
  async saveLastGeneratedPlaylist(name, useOriginalOrder = false) {
    const playlist = useOriginalOrder
      ? window._generatedPlaylistOriginal
      : window._generatedPlaylist;

    if (!playlist || playlist.length === 0) {
      console.error("❌ No generated playlist found");
      console.log("💡 Generate a playlist first, then call saveLastGeneratedPlaylist('Playlist Name')");
      return { success: false, error: 'No playlist available' };
    }

    console.log(`💾 Saving ${useOriginalOrder ? 'original' : 'shuffled'} generated playlist...`);
    console.log(`📝 Playlist contains ${playlist.length} songs`);

    // Don't shuffle again since we already have shuffled/original versions
    return await PlaylistManager.createPlaylist(name, playlist, false);
  }

  /**
   * Send a test message to AI
   */
  async sendTestMessage() {
    const provider = this.getProvider();
    console.log(`🤖 Testing ${provider.name} API connection...`);

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      console.error("❌ No API key available");
      return;
    }

    try {
      const testPrompt = 'Hello! Please respond with a brief greeting.';
      const { url, options } = provider.formatRequest(testPrompt, apiKey);

      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ ${provider.name} API error:`, error);
        return;
      }

      const data = await response.json();
      const { content: message, tokensUsed } = provider.parseResponse(data);

      console.log(`✅ ${provider.name} API Response:`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(message);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Model:", provider.model);
      console.log("Tokens used:", tokensUsed);

    } catch (e) {
      console.error(`❌ Error calling ${provider.name} API:`, e);
    }
  }
}

