/**
 * Prompt Builder Module
 * Generates context-aware prompts for playlist generation
 */

export class PromptBuilder {
  /**
   * Build a context-aware prompt for playlist generation
   * @param {Object} context - The context information (what was clicked)
   * @param {Array} allSongs - All songs to include in the prompt
   * @returns {Object} - {prompt: string, songData: Array}
   */
  static buildPrompt(context, allSongs) {
    let contextDescription = '';
    let basePrompt = '';
    const items = context.data || context.items || []; // Support both data and items properties

    // Build context description based on what was clicked
    switch (context.type) {
      case 'song':
        if (items.length > 0) {
          const song = items[0];
          const artist = song.artistItems?.[0]?.name || song.artists?.[0]?.name || song.artist || 'Unknown Artist';
          const title = song.name || song.title || 'Unknown';
          const album = song.album?.name || song.album || 'Unknown Album';
          contextDescription = `User selected a single song: "${title}" by ${artist} from the album "${album}".`;
          basePrompt = `Create a playlist of 30-50 songs that would go well with this song. Consider similar genre, mood, era, and artist style. Maximum 200 songs.`;
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
          basePrompt = `Create a playlist of 50-100 songs that complement these selected songs. Analyze the common themes, genres, and moods. Maximum 200 songs.`;
        }
        break;

      case 'album':
        if (items.length > 0) {
          const album = items[0];
          const albumName = album.name || album.albumName || 'Unknown Album';
          const artistName = album.albumArtists?.[0]?.name || album.artistName || '';
          contextDescription = `User selected an album: "${albumName}"${artistName ? ` by ${artistName}` : ''}.`;
          basePrompt = `Create a playlist of 50-100 songs that would appeal to someone who enjoys this album. Include similar artists and complementary styles. Maximum 200 songs.`;
        }
        break;

      case 'albums':
        if (items.length > 0) {
          const albumList = items.slice(0, 5).map(a => `"${a.name || a.albumName || 'Unknown'}"`).join(', ');
          contextDescription = `User selected ${items.length} albums: ${albumList}${items.length > 5 ? ', and more' : ''}.`;
          basePrompt = `Create a playlist of 100-150 songs that would appeal to fans of these albums. Find common themes and complementary music. Maximum 200 songs.`;
        }
        break;

      case 'artist':
      case 'albumArtist':
        if (items.length > 0) {
          const artistName = items[0].name || items[0].artistName || 'Unknown Artist';
          contextDescription = `User selected an artist: ${artistName}.`;
          basePrompt = `Create a playlist of 100-150 songs for fans of this artist. Include their best work and similar artists with comparable style. Maximum 200 songs.`;
        }
        break;

      case 'artists':
        if (items.length > 0) {
          const artistList = items.slice(0, 5).map(a => a.name || a.artistName || 'Unknown').join(', ');
          contextDescription = `User selected ${items.length} artists: ${artistList}${items.length > 5 ? ', and more' : ''}.`;
          basePrompt = `Create a playlist of 100-150 songs for fans of these artists. Include their best work and find common musical themes. Maximum 200 songs.`;
        }
        break;

      default:
        contextDescription = 'User wants a general playlist recommendation.';
        basePrompt = `Create a diverse playlist of 50-100 songs showcasing variety from the music library. Maximum 200 songs.`;
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

