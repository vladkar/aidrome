/**
 * API Test Module
 * Tests Subsonic API connection and displays artist information
 */

import { AuthUtils } from './auth-utils.js';

export class ApiTest {
  constructor() {
    this.init();
  }

  async init() {
    if (!AuthUtils.isAuthenticated()) {
      console.warn("⚠️ Not authenticated - skipping API test");
      return;
    }

    await this.testApiConnection();
  }

  /**
   * Test API connection by fetching artists
   */
  async testApiConnection() {
    const creds = AuthUtils.getCredentials();

    console.log("🌐 Server:", creds.server);
    console.log("👤 User:", creds.username);

    const url = AuthUtils.buildApiUrl('getArtists.view');
    console.log("📡 Fetching:", url);

    try {
      const response = await fetch(url);
      const data = await response.json();

      const artists = data["subsonic-response"]?.artists?.index?.flatMap(i => i.artist || []) || [];
      console.log(`🎵 Found ${artists.length} artists`);
      console.table(
        artists.map(a => ({
          id: a.id,
          name: a.name,
          albumCount: a.albumCount,
        }))
      );
    } catch (e) {
      console.error("❌ API call failed:", e);
    }
  }
}

