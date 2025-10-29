/**
 * OpenAI Agent Module
 * Handles communication with OpenAI API
 */

import { AuthUtils } from './auth-utils.js';
import { EncryptionUtils } from './encryption-utils.js';

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
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Hello! Please respond with a brief greeting.'
            }
          ],
          max_tokens: 50
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

