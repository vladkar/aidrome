console.log("🎨 custom-init.js injected");

(() => {
  const raw = localStorage.getItem("store_authentication");
  if (!raw) {
    console.warn("⚠️ store_authentication not found in localStorage");
    return;
  }

  const data = JSON.parse(raw);
  const server = data?.state?.currentServer?.url?.replace(/\/+$/, "");
  const creds  = data?.state?.currentServer?.credential;
  const user   = data?.state?.currentServer?.username;

  if (!server || !creds || !user) {
    console.warn("⚠️ Missing server, credentials, or user");
    return;
  }

  // Example: creds = "u=admin&p=123"  OR  "u=admin&t=TOKEN&s=SALT"
  const url = `${server}/rest/getArtists.view?${creds}&v=1.13.0&c=Feishin&f=json`;

  console.log("🌐 Server:", server);
  console.log("👤 User:", user);
  console.log("📡 Fetching:", url);

  fetch(url)
    .then(r => r.json())
    .then(d => {
      const artists = d["subsonic-response"]?.artists?.index?.flatMap(i => i.artist || []) || [];
      console.log(`🎵 Found ${artists.length} artists`);
      console.table(artists.map(a => ({
        id: a.id,
        name: a.name,
        albumCount: a.albumCount
      })));
    })
    .catch(e => console.error("❌ API call failed:", e));
})();
