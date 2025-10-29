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
