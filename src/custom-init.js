console.log("🎨 custom-init.js injected");

// === OPENAI API KEY INJECTION SECTION (runs independently) ===
(() => {
  const formSelector = "form"; // Login form
  const openaiFieldId = "custom-openai-key";
  let openaiKeyValue = "";

  // Function to get OpenAI key from storage
  const getStoredOpenAIKey = () => {
    try {
      const auth = JSON.parse(localStorage.getItem("store_authentication") || "{}");
      return auth?.state?.currentServer?.openaiKey || "";
    } catch (e) {
      console.error("❌ Error reading OpenAI key:", e);
      return "";
    }
  };

  // Function to save OpenAI key to storage
  const saveOpenAIKey = (key) => {
    try {
      const auth = JSON.parse(localStorage.getItem("store_authentication") || "{}");
      if (auth?.state?.currentServer) {
        auth.state.currentServer.openaiKey = key;
        localStorage.setItem("store_authentication", JSON.stringify(auth));
        console.log("✅ OpenAI key saved securely");
      }
    } catch (e) {
      console.error("❌ Error saving OpenAI key:", e);
    }
  };

  // Create OpenAI API key input field
  const createOpenAIField = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "_root_12yhx_1 _root_12yhx_1 m_f61ca620 mantine-PasswordInput-root m_46b77525 mantine-InputWrapper-root mantine-PasswordInput-root custom-openai-field";
    wrapper.setAttribute("data-variant", "default");
    wrapper.setAttribute("data-field-type", "openai-key");
    wrapper.id = openaiFieldId;

    const storedKey = getStoredOpenAIKey();
    openaiKeyValue = storedKey;

    wrapper.innerHTML = `
      <label class="_label_12yhx_37 m_8fdc1311 mantine-InputWrapper-label mantine-PasswordInput-label"
             data-variant="default"
             data-field-type="openai-key"
             for="custom-openai-key-input"
             id="custom-openai-key-label">
        OpenAI API Key (Optional)
      </label>
      <div class="m_6c018570 mantine-Input-wrapper mantine-PasswordInput-wrapper custom-openai-wrapper"
           data-variant="default"
           data-size="sm"
           data-with-right-section="true"
           data-field-type="openai-key"
           style="--input-height: var(--input-height-sm); --input-fz: var(--mantine-font-size-sm); --input-left-section-pointer-events: none; --input-right-section-pointer-events: all;">
        <div class="m_ccf8da4c _input_12yhx_9 m_8fb7ebe7 mantine-Input-input mantine-PasswordInput-input custom-openai-input"
             data-variant="default"
             data-field-type="openai-key">
          <input class="m_f2d85dd2 mantine-PasswordInput-innerInput custom-openai-inner-input"
                 id="custom-openai-key-input"
                 name="openai-api-key"
                 data-path="openaiKey"
                 data-field-type="openai-key"
                 autocomplete="off"
                 type="password"
                 value="${storedKey}">
        </div>
        <div data-position="right"
             class="_section_12yhx_29 m_82577fc2 mantine-Input-section mantine-PasswordInput-section custom-openai-toggle-section">
          <button class="mantine-focus-never mantine-active m_b1072d44 mantine-PasswordInput-visibilityToggle m_8d3f4000 mantine-ActionIcon-root m_87cf2631 mantine-UnstyledButton-root custom-openai-toggle-btn"
                  data-variant="subtle"
                  data-field-type="openai-key"
                  type="button"
                  aria-label="Toggle OpenAI key visibility"
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
    `;

    // Update value on input
    const input = wrapper.querySelector("input");
    input.addEventListener("input", (e) => {
      openaiKeyValue = e.target.value;
    });

    // Add visibility toggle functionality
    const toggleButton = wrapper.querySelector("button");
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

    return wrapper;
  };

  // Intercept form submission to save OpenAI key
  const interceptFormSubmission = (form) => {
    // Get the initial authentication state before submission
    let initialAuthState = null;

    form.addEventListener("submit", (e) => {
      console.log("📝 Form submitted, will save OpenAI key only if auth succeeds...");

      // Capture the initial state
      try {
        const authData = JSON.parse(localStorage.getItem("store_authentication") || "{}");
        initialAuthState = {
          serverCount: authData?.state?.servers?.length || 0,
          currentServerId: authData?.state?.currentServer?.id || null
        };
      } catch (e) {
        initialAuthState = { serverCount: 0, currentServerId: null };
      }

      // Monitor localStorage for successful authentication
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds max (500ms intervals)

      const authMonitor = setInterval(() => {
        attempts++;

        try {
          const authData = JSON.parse(localStorage.getItem("store_authentication") || "{}");
          const currentServerCount = authData?.state?.servers?.length || 0;
          const currentServerId = authData?.state?.currentServer?.id || null;
          const currentServer = authData?.state?.currentServer;

          // Check if authentication was successful by detecting:
          // 1. Server was added/updated (server count changed OR currentServerId changed)
          // 2. Current server has valid credentials
          const serverAdded = currentServerCount > initialAuthState.serverCount;
          const serverChanged = currentServerId && currentServerId !== initialAuthState.currentServerId;
          const hasValidCreds = currentServer?.credential && currentServer?.url && currentServer?.username;

          if ((serverAdded || serverChanged) && hasValidCreds) {
            console.log("✅ Authentication successful, saving OpenAI key...");

            if (openaiKeyValue && openaiKeyValue.trim()) {
              saveOpenAIKey(openaiKeyValue);
            } else {
              console.log("ℹ️ No OpenAI key provided, skipping save");
            }

            clearInterval(authMonitor);
          } else if (attempts >= maxAttempts) {
            console.log("⏱️ Authentication timeout - OpenAI key NOT saved");
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
  };

  // Monitor for login form
  const formObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) {
          const form = node.matches?.(formSelector) ? node : node.querySelector?.(formSelector);

          if (form && !form.querySelector(`#${openaiFieldId}`)) {
            console.log("🔐 Login form detected, injecting OpenAI key field...");

            // Find password field wrapper
            const passwordWrapper = form.querySelector(".mantine-PasswordInput-root");

            if (passwordWrapper) {
              // Insert OpenAI field after password field
              const openaiField = createOpenAIField();
              passwordWrapper.parentNode.insertBefore(
                openaiField,
                passwordWrapper.nextSibling
              );

              console.log("✅ OpenAI key field injected");

              // Intercept form submission
              interceptFormSubmission(form);
            }
          }
        }
      }
    }
  });

  formObserver.observe(document.body, { childList: true, subtree: true });
  console.log("👀 Monitoring for login form...");
})();

// === BASE API TEST SECTION ===
(() => {
  const raw = localStorage.getItem("store_authentication");
  if (!raw) {
    console.warn("⚠️ store_authentication not found in localStorage");
    return;
  }

  const data = JSON.parse(raw);
  const server = data?.state?.currentServer?.url?.replace(/\/+$/, "");
  const creds = data?.state?.currentServer?.credential;
  const user = data?.state?.currentServer?.username;

  if (!server || !creds || !user) {
    console.warn("⚠️ Missing server, credentials, or user");
    return;
  }

  const url = `${server}/rest/getArtists.view?${creds}&v=1.13.0&c=Feishin&f=json`;
  console.log("🌐 Server:", server);
  console.log("👤 User:", user);
  console.log("📡 Fetching:", url);

  fetch(url)
    .then(r => r.json())
    .then(d => {
      const artists =
        d["subsonic-response"]?.artists?.index?.flatMap(i => i.artist || []) ||
        [];
      console.log(`🎵 Found ${artists.length} artists`);
      console.table(
        artists.map(a => ({
          id: a.id,
          name: a.name,
          albumCount: a.albumCount,
        }))
      );
    })
    .catch(e => console.error("❌ API call failed:", e));

  // === CONTEXT MENU PATCH SECTION ===

  const menuSelector = "div._container_1w9l4_1"; // Feishin context menu root
  const customButtonId = "custom-context-button";

  const createCustomButton = () => {
    const btn = document.createElement("button");
    btn.className = "_context-menu-button_1w9l4_11"; // match Mantine style
    btn.id = customButtonId;

    // inner structure like others
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
          My Custom Action
        </div>
      </div>
    `;

    btn.addEventListener("click", async () => {
      console.log("🪄 Custom context action clicked!");

      const startTime = Date.now();
      console.log("🚀 STAGE 1: Fetching all songs for all artists...");

      try {
        // Stage 1: Get all artists
        console.log("📊 Progress: Fetching artists list...");
        const artistsUrl = `${server}/rest/getArtists.view?${creds}&v=1.13.0&c=Feishin&f=json`;
        const artistsResp = await fetch(artistsUrl);
        const artistsData = await artistsResp.json();

        const artists = artistsData["subsonic-response"]?.artists?.index?.flatMap(i => i.artist || []) || [];
        console.log(`✅ Found ${artists.length} artists`);

        if (artists.length === 0) {
          console.warn("⚠️ No artists found");
          return;
        }

        // Stage 1: Get all songs using efficient batching
        // Use getAlbumList2 to get all albums, then getMusicDirectory for songs
        console.log("📊 Progress: Fetching all albums...");

        const allSongs = [];
        const batchSize = 500; // Subsonic API typically supports up to 500
        let offset = 0;
        let totalAlbums = 0;
        let albumsFetched = 0;

        // First, get total count of albums
        const countUrl = `${server}/rest/getAlbumList2.view?${creds}&v=1.13.0&c=Feishin&f=json&type=alphabeticalByName&size=1&offset=0`;
        const countResp = await fetch(countUrl);
        const countData = await countResp.json();
        totalAlbums = countData["subsonic-response"]?.albumList2?.album?.length || 0;

        console.log(`📚 Fetching albums in batches of ${batchSize}...`);

        // Fetch all albums in large batches
        const albums = [];
        while (true) {
          const albumUrl = `${server}/rest/getAlbumList2.view?${creds}&v=1.13.0&c=Feishin&f=json&type=alphabeticalByName&size=${batchSize}&offset=${offset}`;
          const albumResp = await fetch(albumUrl);
          const albumData = await albumResp.json();
          const batch = albumData["subsonic-response"]?.albumList2?.album || [];

          if (batch.length === 0) break;

          albums.push(...batch);
          offset += batch.length;
          console.log(`📊 Progress: ${offset} albums fetched...`);

          if (batch.length < batchSize) break; // Last batch
        }

        console.log(`✅ Total albums found: ${albums.length}`);

        // Now fetch songs for each album (this is the bottleneck)
        // We'll do this in parallel batches to speed it up
        const parallelRequests = 500; // Fetch 100 albums simultaneously

        for (let i = 0; i < albums.length; i += parallelRequests) {
          const albumBatch = albums.slice(i, i + parallelRequests);

          const songPromises = albumBatch.map(async (album) => {
            const songUrl = `${server}/rest/getAlbum.view?${creds}&v=1.13.0&c=Feishin&f=json&id=${album.id}`;
            const songResp = await fetch(songUrl);
            const songData = await songResp.json();
            return songData["subsonic-response"]?.album?.song || [];
          });

          const batchResults = await Promise.all(songPromises);
          batchResults.forEach(songs => allSongs.push(...songs));

          albumsFetched += albumBatch.length;
          const progress = ((albumsFetched / albums.length) * 100).toFixed(1);
          console.log(`📊 Progress: ${albumsFetched}/${albums.length} albums processed (${progress}%) - ${allSongs.length} songs so far...`);
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`\n🎉 STAGE 1 COMPLETE!`);
        console.log(`⏱️ Time taken: ${duration} seconds`);
        console.log(`🎵 Total songs found: ${allSongs.length}`);
        console.log(`📀 Total albums: ${albums.length}`);
        console.log(`🎤 Total artists: ${artists.length}`);
        console.log(`\n📋 Sample songs (first 100):`);
        console.table(
          allSongs.slice(0, 100).map(s => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            album: s.album,
            duration: s.duration,
            year: s.year
          }))
        );

        // Store for later stages
        window._customPluginData = {
          artists,
          albums,
          songs: allSongs,
          fetchTime: duration
        };

        console.log(`\n💾 Data stored in window._customPluginData for next stages`);

      } catch (e) {
        console.error("❌ Error fetching songs:", e);
      }
    });

    return btn;
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.matches(menuSelector)) {
          console.log("📋 Context menu detected");
          // Avoid adding multiple times
          if (!node.querySelector(`#${customButtonId}`)) {
            const btn = createCustomButton();
            node.querySelector(".mantine-Stack-root")?.appendChild(btn);
            console.log("✅ Custom button added to context menu");
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
