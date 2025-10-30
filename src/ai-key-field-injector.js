/**
 * AI API Key Field Injector Module
 * Handles injection of AI API key field into Feishin's login/add server form
 * Supports multiple AI providers (OpenAI, Claude)
 */

import { AuthUtils } from './auth-utils.js';
import { EncryptionUtils } from './encryption-utils.js';

export class AIKeyFieldInjector {
  constructor() {
    this.formSelector = "form";
    this.aiFieldId = "custom-ai-key";
    this.aiKeyValue = "";
    this.pendingAIKeys = new Map();
    this.originalSetItem = localStorage.setItem.bind(localStorage);

    this.init();
  }

  init() {
    this.interceptLocalStorage();
    this.startFormMonitoring();
    console.log("👀 Monitoring for login form...");
  }

  /**
   * Intercept localStorage.setItem to inject AI keys
   */
  interceptLocalStorage() {
    const self = this;
    localStorage.setItem = function(key, value) {
      if (key === "store_authentication" && self.pendingAIKeys.size > 0) {
        try {
          const data = JSON.parse(value);

          // Inject pending AI keys into the data before saving
          self.pendingAIKeys.forEach((aiKeyEncrypted, serverId) => {
            // Update currentServer if it matches
            if (data?.state?.currentServer?.id === serverId) {
              data.state.currentServer.aiKeyEncrypted = aiKeyEncrypted;
            }

            // Update serverList
            if (data?.state?.serverList?.[serverId]) {
              data.state.serverList[serverId].aiKeyEncrypted = aiKeyEncrypted;
            }
          });

          value = JSON.stringify(data);
        } catch (e) {
          console.error("❌ Error intercepting localStorage:", e);
        }
      }

      return self.originalSetItem(key, value);
    };
  }

  /**
   * Get stored AI key for current server (decrypted)
   */
  async getStoredAIKey() {
    try {
      const server = AuthUtils.getCurrentServer();
      if (!server?.aiKeyEncrypted) {
        return "";
      }

      const decrypted = await EncryptionUtils.decrypt(
        server.aiKeyEncrypted,
        server.id,
        server.username
      );

      return decrypted || "";
    } catch (e) {
      console.error("❌ Error reading AI key:", e);
      return "";
    }
  }

  /**
   * Save AI key to storage (encrypted)
   */
  async saveAIKey(key) {
    try {
      const auth = AuthUtils.getAuthData();

      if (!auth?.state?.currentServer) {
        console.warn("⚠️ No current server found, cannot save AI key");
        return;
      }

      const serverId = auth.state.currentServer.id;
      const username = auth.state.currentServer.username;

      // Encrypt the key before storage
      const encrypted = await EncryptionUtils.encrypt(key, serverId, username);

      if (!encrypted) {
        console.error("❌ Failed to encrypt AI key");
        return;
      }

      // Store the encrypted key for interception
      this.pendingAIKeys.set(serverId, encrypted);

      // Save encrypted key to currentServer
      auth.state.currentServer.aiKeyEncrypted = encrypted;

      // Also save to serverList for persistence
      if (auth.state.serverList && serverId && auth.state.serverList[serverId]) {
        auth.state.serverList[serverId].aiKeyEncrypted = encrypted;
      }

      this.originalSetItem("store_authentication", JSON.stringify(auth));
      console.log("✅ AI key encrypted and saved for server:", serverId.substring(0, 8) + "...");

      // Verify the save worked
      setTimeout(() => {
        const verify = AuthUtils.getAuthData();
        const savedKey = verify?.state?.currentServer?.aiKeyEncrypted;
        if (savedKey !== encrypted) {
          console.warn("⚠️ AI key was overwritten, but interceptor will restore it");
        }
      }, 100);
    } catch (e) {
      console.error("❌ Error saving AI key:", e);
    }
  }

  /**
   * Get AI provider configuration
   */
  getAIProvider() {
    try {
      const server = AuthUtils.getCurrentServer();
      // Default to 'openai' for backward compatibility
      return server?.aiProvider || 'openai';
    } catch (e) {
      return 'openai';
    }
  }

  /**
   * Save AI provider configuration
   */
  saveAIProvider(provider) {
    try {
      const auth = AuthUtils.getAuthData();

      if (!auth?.state?.currentServer) {
        console.warn("⚠️ No current server found, cannot save AI provider");
        return;
      }

      const serverId = auth.state.currentServer.id;

      // Save provider to currentServer
      auth.state.currentServer.aiProvider = provider;

      // Also save to serverList for persistence
      if (auth.state.serverList && serverId && auth.state.serverList[serverId]) {
        auth.state.serverList[serverId].aiProvider = provider;
      }

      this.originalSetItem("store_authentication", JSON.stringify(auth));
      console.log("✅ AI provider set to:", provider);
    } catch (e) {
      console.error("❌ Error saving AI provider:", e);
    }
  }

  /**
   * Create AI API key input field with provider selector
   */
  async createAIField() {
    const wrapper = document.createElement("div");
    wrapper.className = "custom-ai-field-wrapper";
    wrapper.id = this.aiFieldId;

    const storedKey = await this.getStoredAIKey();
    const storedProvider = this.getAIProvider();
    this.aiKeyValue = storedKey;

    wrapper.innerHTML = `
      <!-- AI Provider Selector -->
      <div class="_root_12yhx_1 m_46b77525 mantine-InputWrapper-root custom-ai-provider-field"
           data-variant="default"
           style="margin-bottom: 0.5rem;">
        <label class="_label_12yhx_37 m_8fdc1311 mantine-InputWrapper-label"
               data-variant="default"
               for="custom-ai-provider-select"
               id="custom-ai-provider-label">
          AI Provider
        </label>
        <select class="m_6c018570 mantine-Input-wrapper custom-ai-provider-select"
                id="custom-ai-provider-select"
                name="ai-provider"
                style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--mantine-color-gray-4); background: var(--mantine-color-body); color: var(--mantine-color-text);">
          <option value="openai" ${storedProvider === 'openai' ? 'selected' : ''}>OpenAI (GPT-4o-mini)</option>
          <option value="claude" ${storedProvider === 'claude' ? 'selected' : ''}>Anthropic Claude</option>
        </select>
      </div>

      <!-- AI API Key Input -->
      <div class="_root_12yhx_1 _root_12yhx_1 m_f61ca620 mantine-PasswordInput-root m_46b77525 mantine-InputWrapper-root mantine-PasswordInput-root custom-ai-key-field"
           data-variant="default"
           data-field-type="ai-key">
        <label class="_label_12yhx_37 m_8fdc1311 mantine-InputWrapper-label mantine-PasswordInput-label"
               data-variant="default"
               data-field-type="ai-key"
               for="custom-ai-key-input"
               id="custom-ai-key-label">
          AI API Key (Optional)
        </label>
        <div class="m_6c018570 mantine-Input-wrapper mantine-PasswordInput-wrapper custom-ai-wrapper"
             data-variant="default"
             data-size="sm"
             data-with-right-section="true"
             data-field-type="ai-key"
             style="--input-height: var(--input-height-sm); --input-fz: var(--mantine-font-size-sm); --input-left-section-pointer-events: none; --input-right-section-pointer-events: all;">
          <div class="m_ccf8da4c _input_12yhx_9 m_8fb7ebe7 mantine-Input-input mantine-PasswordInput-input custom-ai-input"
               data-variant="default"
               data-field-type="ai-key">
            <input class="m_f2d85dd2 mantine-PasswordInput-innerInput custom-ai-inner-input"
                   id="custom-ai-key-input"
                   name="ai-api-key"
                   data-path="aiKey"
                   data-field-type="ai-key"
                   autocomplete="off"
                   type="password"
                   value="${storedKey}">
          </div>
          <div data-position="right"
               class="_section_12yhx_29 m_82577fc2 mantine-Input-section mantine-PasswordInput-section custom-ai-toggle-section">
            <button class="mantine-focus-never mantine-active m_b1072d44 mantine-PasswordInput-visibilityToggle m_8d3f4000 mantine-ActionIcon-root m_87cf2631 mantine-UnstyledButton-root custom-ai-toggle-btn"
                    data-variant="subtle"
                    data-field-type="ai-key"
                    type="button"
                    aria-label="Toggle AI key visibility"
                    tabindex="-1"
                    style="--ai-bg: transparent; --ai-hover: var(--mantine-color-gray-light-hover); --ai-color: var(--mantine-color-gray-light-color); --ai-bd: calc(0.0625rem * var(--mantine-scale)) solid transparent;">
              <span class="m_8d3afb97 mantine-ActionIcon-icon">
                <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
                     style="width: var(--psi-icon-size); height: var(--psi-icon-size);">
                  <path d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z"
                        fill="currentColor"
                        fill-rule="evenodd"
                        clip-rule="evenodd"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Update value on input
    const input = wrapper.querySelector("input");
    input.addEventListener("input", (e) => {
      this.aiKeyValue = e.target.value;
    });

    // Update provider on select change
    const providerSelect = wrapper.querySelector("select");
    providerSelect.addEventListener("change", (e) => {
      // Provider will be saved when form is submitted successfully
      console.log("🔄 AI Provider changed to:", e.target.value);
    });

    // Add visibility toggle functionality
    this.setupVisibilityToggle(wrapper);

    return wrapper;
  }

  /**
   * Setup visibility toggle for password field
   */
  setupVisibilityToggle(wrapper) {
    const toggleButton = wrapper.querySelector("button");
    const input = wrapper.querySelector("input");
    const eyeIcon = toggleButton.querySelector("svg");

    const eyeOpenPath = 'M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z';
    const eyeClosedPath = 'M13.3536 2.35355C13.5488 2.15829 13.5488 1.84171 13.3536 1.64645C13.1583 1.45118 12.8417 1.45118 12.6464 1.64645L10.6828 3.61012C9.70652 3.21671 8.63759 3 7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C0.902818 9.08812 2.02543 10.1649 3.36133 10.9134L1.64645 12.6283C1.45118 12.8236 1.45118 13.1401 1.64645 13.3354C1.84171 13.5307 2.15829 13.5307 2.35355 13.3354L4.31723 11.3717C5.29348 11.7651 6.36241 11.9817 7.5 11.9817C10.6921 11.9817 13.3436 10.2753 14.924 7.74668C15.0253 7.58454 15.0253 7.37881 14.924 7.21667C14.0972 5.89356 12.9746 4.81676 11.6387 4.06827L13.3536 2.35355ZM9.90428 4.38623C9.15186 4.1361 8.34096 4 7.5 4C4.80285 4 2.52952 5.37816 1.09622 7.50001C1.87284 8.6497 2.93347 9.58106 4.18769 10.2118L9.90428 4.38623ZM5.81231 10.7882C6.56473 11.0383 7.37563 11.1744 8.21652 11.1744C10.9137 11.1744 13.1871 9.79627 14.6203 7.67442C13.8437 6.52473 12.783 5.59337 11.5288 4.96261L5.81231 10.7882Z';

    toggleButton.addEventListener("click", () => {
      if (input.type === "password") {
        input.type = "text";
        eyeIcon.querySelector("path").setAttribute("d", eyeClosedPath);
      } else {
        input.type = "password";
        eyeIcon.querySelector("path").setAttribute("d", eyeOpenPath);
      }
    });
  }

  /**
   * Intercept form submission to save AI key and provider only on successful auth
   */
  interceptFormSubmission(form) {
    let initialAuthState = null;

    form.addEventListener("submit", (e) => {
      console.log("📝 Form submitted, monitoring authentication...");

      // Capture the initial state
      try {
        const currentServer = AuthUtils.getCurrentServer();
        initialAuthState = {
          serverCount: AuthUtils.getServerCount(),
          currentServerId: currentServer?.id || null,
          hasCurrentServer: !!currentServer,
          credential: currentServer?.credential || null,
          url: currentServer?.url || null,
          username: currentServer?.username || null
        };
      } catch (e) {
        initialAuthState = {
          serverCount: 0,
          currentServerId: null,
          hasCurrentServer: false,
          credential: null,
          url: null,
          username: null
        };
      }

      // Monitor localStorage for successful authentication
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds max (500ms intervals)

      const authMonitor = setInterval(() => {
        attempts++;

        try {
          const serverCount = AuthUtils.getServerCount();
          const currentServerId = AuthUtils.getCurrentServer()?.id || null;
          const currentServer = AuthUtils.getCurrentServer();

          // Check if authentication was successful
          const serverAdded = serverCount > initialAuthState.serverCount;
          const serverChanged = currentServerId && currentServerId !== initialAuthState.currentServerId;
          const hasValidCreds = currentServer?.credential && currentServer?.url && currentServer?.username;

          // Check if existing server was updated (same ID but credentials changed)
          const serverUpdated = currentServerId === initialAuthState.currentServerId &&
                                currentServer?.credential !== initialAuthState.credential &&
                                hasValidCreds;

          if ((serverAdded || serverChanged || serverUpdated) && hasValidCreds) {
            console.log("✅ Authentication successful" + (serverUpdated ? " (server updated)" : ""));

            // Save AI provider
            const providerSelect = form.querySelector("#custom-ai-provider-select");
            if (providerSelect) {
              this.saveAIProvider(providerSelect.value);
            }

            // Save AI key
            if (this.aiKeyValue && this.aiKeyValue.trim()) {
              this.saveAIKey(this.aiKeyValue);
            }

            clearInterval(authMonitor);
          } else if (attempts >= maxAttempts) {
            console.log("⏱️ Authentication timeout - AI key NOT saved");
            clearInterval(authMonitor);
          }
        } catch (e) {
          console.error("❌ Error monitoring authentication:", e);
          if (attempts >= maxAttempts) {
            clearInterval(authMonitor);
          }
        }
      }, 500);
    });
  }

  /**
   * Monitor for login form and inject field
   */
  startFormMonitoring() {
    const formObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            const form = node.matches?.(this.formSelector) ? node : node.querySelector?.(this.formSelector);

            if (form && !form.querySelector(`#${this.aiFieldId}`)) {
              console.log("🔐 Login form detected, injecting AI key field...");

              // Find password field wrapper
              const passwordWrapper = form.querySelector(".mantine-PasswordInput-root");

              if (passwordWrapper) {
                // Insert AI field after password field (async)
                this.createAIField().then(aiField => {
                  // Safety check: ensure elements are still in the DOM
                  if (passwordWrapper.parentNode && document.body.contains(passwordWrapper)) {
                    passwordWrapper.parentNode.insertBefore(
                      aiField,
                      passwordWrapper.nextSibling
                    );

                    console.log("✅ AI key field injected");
                  } else {
                    console.warn("⚠️ Password wrapper was removed from DOM, skipping AI field injection");
                  }

                  // Intercept form submission (even if injection failed, we still want to monitor)
                  if (document.body.contains(form)) {
                    this.interceptFormSubmission(form);
                  }
                }).catch(err => {
                  console.error("❌ Error creating AI field:", err);
                });
              }
            }
          }
        }
      }
    });

    formObserver.observe(document.body, { childList: true, subtree: true });
  }
}


