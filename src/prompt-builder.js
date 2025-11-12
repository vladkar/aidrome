/**
 * Prompt Builder Module
 * Generates context-aware prompts for playlist generation
 */

export class PromptBuilder {
  /**
   * Build a context-aware prompt for playlist generation
   * @param {Object} context - The context information (what was clicked)
   * @param {Array} allSongs - All songs to include in the prompt
   * @param {number} playlistSize - Target number of songs for the playlist (default: 100)
   * @returns {Object} - {prompt: string, songData: Array}
   */
  static buildPrompt(context, allSongs, playlistSize = 100) {
    let contextDescription = '';
    let basePrompt = '';
    const items = context.data || context.items || []; // Support both data and items properties
    const maxSongs = 200; // Hard limit

    // Build context description based on what was clicked
    switch (context.type) {
      case 'song':
        if (items.length > 0) {
          const song = items[0];
          const artist = song.artistItems?.[0]?.name || song.artists?.[0]?.name || song.artist || 'Unknown Artist';
          const title = song.name || song.title || 'Unknown';
          const album = song.album?.name || song.album || 'Unknown Album';
          contextDescription = `User selected a single song: "${title}" by ${artist} from the album "${album}".`;
          basePrompt = `Create a diverse playlist of ${playlistSize} songs that match the GENRE, MOOD, and VIBE of this song.

STRICT RULES FOR VARIETY:
1. Include songs from AT LEAST 30-50 DIFFERENT ARTISTS
2. NEVER include more than 3 songs from the same artist
3. NEVER include more than 2 songs from the same album
4. Prioritize musical similarity (genre, mood, tempo, energy) over artist similarity
5. Mix different eras and subgenres within the same style

Maximum ${maxSongs} songs.`;
        }
        break;

      case 'songs':
        if (items.length > 0) {
          const songList = items.slice(0, 5).map(s => {
            const title = s.name || s.title || 'Unknown';
            const artist = s.artistItems?.[0]?.name || s.artists?.[0]?.name || s.artist || 'Unknown Artist';
            return `"${title}" by ${artist}`;
          }).join(', ');
          contextDescription = `User selected ${items.length} songs: ${songList}${items.length > 5 ? ', and more' : ''}.`;
          basePrompt = `Create a diverse playlist of ${playlistSize} songs that match the GENRE, MOOD, and VIBE of these songs.

STRICT RULES FOR VARIETY:
1. Include songs from AT LEAST 40-60 DIFFERENT ARTISTS
2. NEVER include more than 3 songs from the same artist
3. NEVER include more than 2 songs from the same album
4. Analyze common themes (mood, tempo, energy, genre) but ensure wide artist diversity
5. Mix complementary styles and eras

Maximum ${maxSongs} songs.`;
        }
        break;

      case 'album':
        if (items.length > 0) {
          const album = items[0];
          const albumName = album.name || album.albumName || 'Unknown Album';
          const artistName = album.albumArtists?.[0]?.name || album.artistName || '';
          contextDescription = `User selected an album: "${albumName}"${artistName ? ` by ${artistName}` : ''}.`;
          basePrompt = `Create a diverse playlist of ${playlistSize} songs inspired by the GENRE, MOOD, and VIBE of this album.

STRICT RULES FOR VARIETY:
1. Include songs from AT LEAST 50-70 DIFFERENT ARTISTS
2. NEVER include more than 2 songs from the same artist
3. NEVER include more than 1 song from the same album
4. DO NOT include the entire selected album - use it only as inspiration
5. Focus on complementary musical styles, atmosphere, and energy
6. Mix different artists who share similar sonic qualities

Maximum ${maxSongs} songs.`;
        }
        break;

      case 'albums':
        if (items.length > 0) {
          const albumList = items.slice(0, 5).map(a => `"${a.name || a.albumName || 'Unknown'}"`).join(', ');
          contextDescription = `User selected ${items.length} albums: ${albumList}${items.length > 5 ? ', and more' : ''}.`;
          basePrompt = `Create a diverse playlist of ${playlistSize} songs inspired by the GENRE, MOOD, and VIBE of these albums.

STRICT RULES FOR VARIETY:
1. Include songs from AT LEAST 50-80 DIFFERENT ARTISTS
2. NEVER include more than 2 songs from the same artist
3. NEVER include more than 1 song from the same album
4. DO NOT include tracks from the selected albums - use them only as inspiration
5. Find common musical themes across the albums and explore similar artists
6. Mix complementary styles and subgenres

Maximum ${maxSongs} songs.`;
        }
        break;

      case 'artist':
      case 'albumArtist':
        if (items.length > 0) {
          const artistName = items[0].name || items[0].artistName || 'Unknown Artist';
          contextDescription = `User selected an artist: ${artistName}.`;
          basePrompt = `Create a diverse playlist of ${playlistSize} songs that match the GENRE, MOOD, and VIBE of ${artistName}.

STRICT RULES FOR VARIETY:
1. Include AT MOST 5-10 songs from ${artistName}
2. Include songs from AT LEAST 40-60 OTHER ARTISTS with similar style
3. NEVER include more than 3 songs from any single artist
4. NEVER include more than 2 songs from the same album
5. Focus on artists with comparable sound, energy, and musical approach
6. Mix different eras and related subgenres

Maximum ${maxSongs} songs.`;
        }
        break;

      case 'artists':
        if (items.length > 0) {
          const artistList = items.slice(0, 5).map(a => a.name || a.artistName || 'Unknown').join(', ');
          contextDescription = `User selected ${items.length} artists: ${artistList}${items.length > 5 ? ', and more' : ''}.`;
          basePrompt = `Create a diverse playlist of ${playlistSize} songs that match the GENRE, MOOD, and VIBE of these artists.

STRICT RULES FOR VARIETY:
1. Include AT MOST 3-5 songs from each selected artist
2. Include songs from AT LEAST 50-70 OTHER ARTISTS with similar style
3. NEVER include more than 5 songs from any single artist
4. NEVER include more than 2 songs from the same album
5. Find artists with comparable sound and common musical themes
6. Mix complementary styles and eras

Maximum ${maxSongs} songs.`;
        }
        break;

      default:
        contextDescription = 'User wants a general playlist recommendation.';
        basePrompt = `Create a diverse playlist of ${playlistSize} songs showcasing variety from the music library. Maximum ${maxSongs} songs.`;
    }

    // Group songs by album for efficient representation
    const albumGroups = {};
    allSongs.forEach(song => {
      const albumKey = `${song.artist}|||${song.album}|||${song.year || 'N/A'}`;
      if (!albumGroups[albumKey]) {
        albumGroups[albumKey] = [];
      }
      albumGroups[albumKey].push(song);
    });

    // Build compact album-grouped structure
    const albumEntries = Object.entries(albumGroups).map(([key, songs]) => {
      const [artist, album, year] = key.split('|||');
      const songList = songs.map(s => `${s.id}:${s.title}`).join('|');
      return `${artist}::${album}::${year}::${songList}`;
    });

    // Create a summary of the library
    const artistCount = new Set(allSongs.map(s => s.artist)).size;
    const albumCount = Object.keys(albumGroups).length;
    const yearRange = [
      Math.min(...allSongs.map(s => s.year || 9999)),
      Math.max(...allSongs.map(s => s.year || 0))
    ];

    // Get top artists by song count
    const artistCounts = {};
    allSongs.forEach(s => {
      artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1;
    });
    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([artist, count]) => `${artist} (${count} songs)`)
      .join(', ');

    const compactDatabase = albumEntries.join('\n');

    const prompt = `${contextDescription}

${basePrompt}

LIBRARY OVERVIEW:
- Total songs: ${allSongs.length}
- Total artists: ${artistCount}
- Total albums: ${albumCount}
- Year range: ${yearRange[0]} - ${yearRange[1]}
- Top artists: ${topArtists}

SONG DATABASE (grouped by album to save space):
Format: Artist::Album::Year::SongID1:Title1|SongID2:Title2|...

${compactDatabase}

Please analyze the library and return a JSON array containing ONLY the song IDs for the playlist. Format:
["song-id-1", "song-id-2", "song-id-3", ...]

Return ONLY the JSON array, no additional text or explanation.`;

    return { prompt, songData: allSongs };
  }
}

