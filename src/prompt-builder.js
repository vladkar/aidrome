/**
 * Prompt Builder Module
 * Generates context-aware prompts for playlist generation
 */

export class PromptBuilder {
  /**
   * Build a context-aware prompt for playlist generation
   * @param {Object} context - The context information (what was clicked)
   * @param {Array} relevantSongs - Filtered songs to include in the prompt
   * @returns {Object} - {prompt: string, songData: Array}
   */
  static buildPrompt(context, relevantSongs) {
    let contextDescription = '';
    let basePrompt = '';

    // Build context description based on what was clicked
    switch (context.type) {
      case 'song':
        const song = context.items[0];
        contextDescription = `User selected a single song: "${song.title}" by ${song.artist} from the album "${song.album}".`;
        basePrompt = `Create a playlist of 30-50 songs that would go well with this song. Consider similar genre, mood, era, and artist style. Maximum 200 songs.`;
        break;

      case 'songs':
        const songList = context.items.slice(0, 5).map(s => `"${s.title}" by ${s.artist}`).join(', ');
        contextDescription = `User selected ${context.items.length} songs: ${songList}${context.items.length > 5 ? ', and more' : ''}.`;
        basePrompt = `Create a playlist of 50-100 songs that complement these selected songs. Analyze the common themes, genres, and moods. Maximum 200 songs.`;
        break;

      case 'album':
        contextDescription = `User selected an album: "${context.albumName}"${context.artistName ? ` by ${context.artistName}` : ''}.`;
        basePrompt = `Create a playlist of 50-100 songs that would appeal to someone who enjoys this album. Include similar artists and complementary styles. Maximum 200 songs.`;
        break;

      case 'albums':
        const albumList = context.items.slice(0, 5).map(a => `"${a.albumName}"`).join(', ');
        contextDescription = `User selected ${context.items.length} albums: ${albumList}${context.items.length > 5 ? ', and more' : ''}.`;
        basePrompt = `Create a playlist of 100-150 songs that would appeal to fans of these albums. Find common themes and complementary music. Maximum 200 songs.`;
        break;

      case 'artist':
        contextDescription = `User selected an artist: ${context.artistName}.`;
        basePrompt = `Create a playlist of 100-150 songs for fans of this artist. Include their best work and similar artists with comparable style. Maximum 200 songs.`;
        break;

      case 'artists':
        const artistList = context.items.slice(0, 5).map(a => a.artistName).join(', ');
        contextDescription = `User selected ${context.items.length} artists: ${artistList}${context.items.length > 5 ? ', and more' : ''}.`;
        basePrompt = `Create a playlist of 100-150 songs for fans of these artists. Include their best work and find common musical themes. Maximum 200 songs.`;
        break;

      default:
        contextDescription = 'User wants a general playlist recommendation.';
        basePrompt = `Create a diverse playlist of 50-100 songs showcasing variety from the music library. Maximum 200 songs.`;
    }

    // Group songs by album for efficient representation
    const albumGroups = {};
    relevantSongs.forEach(song => {
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
    const artistCount = new Set(relevantSongs.map(s => s.artist)).size;
    const albumCount = Object.keys(albumGroups).length;
    const yearRange = [
      Math.min(...relevantSongs.map(s => s.year || 9999)),
      Math.max(...relevantSongs.map(s => s.year || 0))
    ];

    // Get top artists by song count
    const artistCounts = {};
    relevantSongs.forEach(s => {
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
- Total songs: ${relevantSongs.length}
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

    return { prompt, songData: relevantSongs };
  }
}

