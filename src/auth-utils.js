/**
 * Authentication Utilities Module
 * Provides helper functions for accessing and managing Feishin authentication state
 */

export const AuthUtils = {
  /**
   * Get current authentication data from localStorage
   */
  getAuthData() {
    try {
      const raw = localStorage.getItem("store_authentication");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("❌ Error reading authentication data:", e);
      return null;
    }
  },

  /**
   * Get current server configuration
   */
  getCurrentServer() {
    const data = this.getAuthData();
    return data?.state?.currentServer || null;
  },

  /**
   * Get server credentials
   */
  getCredentials() {
    const server = this.getCurrentServer();
    if (!server) return null;

    return {
      server: server.url?.replace(/\/+$/, ""),
      credential: server.credential,
      username: server.username,
      userId: server.userId,
      serverId: server.id
    };
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const creds = this.getCredentials();
    return !!(creds?.server && creds?.credential && creds?.username);
  },

  /**
   * Get all servers from serverList
   */
  getAllServers() {
    const data = this.getAuthData();
    const serverList = data?.state?.serverList;
    return serverList ? Object.values(serverList) : [];
  },

  /**
   * Get server count
   */
  getServerCount() {
    const data = this.getAuthData();
    return data?.state?.serverList ? Object.keys(data.state.serverList).length : 0;
  },

  /**
   * Build a Subsonic API URL
   */
  buildApiUrl(endpoint, params = {}) {
    const creds = this.getCredentials();
    if (!creds) return null;

    const queryParams = new URLSearchParams({
      ...params,
      v: '1.13.0',
      c: 'Feishin',
      f: 'json'
    });

    return `${creds.server}/rest/${endpoint}?${creds.credential}&${queryParams.toString()}`;
  }
};

