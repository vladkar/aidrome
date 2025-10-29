console.log("🎨 custom-init.js injected");

(() => {
  // === BASE SECTION (unchanged) ===
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

    btn.addEventListener("click", () => {
      console.log("🪄 Custom context action clicked!");
      alert("Custom action triggered!");
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
