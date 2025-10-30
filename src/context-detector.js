/**
 * Context Detector Module
 * Detects what was selected/clicked in Feishin's UI
 */

export class ContextDetector {
  /**
   * Extract context information from the page
   * Returns: {type: string, items?: array, albumName?: string, artistName?: string, albumId?: string, artistId?: string}
   */
  static extractContext() {
    const context = {
      type: 'unknown',
      items: []
    };

    console.log("🔍 Extracting context from page...");
    console.log("Current URL:", window.location.href);

    // Check for "X selected" button in context menu (Feishin pattern)
    const contextMenuButton = document.querySelector('._context-menu-button_1w9l4_11 ._left_1w9l4_33');
    if (contextMenuButton) {
      const selectionText = contextMenuButton.textContent.trim();
      console.log("📋 Context menu button text:", selectionText);

      if (selectionText.includes('selected')) {
        const count = parseInt(selectionText.match(/(\d+)\s+selected/)?.[1] || '0');
        console.log(`📋 Found ${count} selected items`);

        // Find selected rows in AG Grid (for songs)
        const selectedRows = document.querySelectorAll('.ag-row-selected');
        console.log(`📋 Found ${selectedRows.length} selected AG Grid rows`);

        if (selectedRows.length > 0) {
          context.type = selectedRows.length > 1 ? 'songs' : 'song';
          context.items = Array.from(selectedRows).map(row => this.extractSongFromAGGridRow(row)).filter(Boolean);
          console.log(`✅ Extracted ${context.items.length} songs from selected rows`);
          if (context.items.length > 0) return context;
        }
      }
    }

    // Check for selected album/artist cards (when on list pages, not inside an album/artist)
    if (contextMenuButton?.textContent.includes('selected')) {
      const selectedCards = document.querySelectorAll('[data-selected="true"]');
      console.log(`📋 Found ${selectedCards.length} selected cards with data-selected`);

      if (selectedCards.length > 0) {
        const albums = [];
        const artists = [];

        selectedCards.forEach(card => {
          // Try to extract album info
          const albumLink = card.querySelector('a[href*="/albums/"]');
          if (albumLink) {
            const albumName = albumLink.textContent?.trim() || card.querySelector('[class*="title"]')?.textContent?.trim();
            const albumId = albumLink.href.match(/\/albums\/([^/?]+)/)?.[1];
            if (albumName) {
              albums.push({ albumName, albumId });
              console.log(`📀 Extracted album: ${albumName}`);
            }
          }

          // Try to extract artist info
          const artistLink = card.querySelector('a[href*="/album-artists/"], a[href*="/artists/"]');
          if (artistLink) {
            const artistName = artistLink.textContent?.trim() || card.querySelector('[class*="title"]')?.textContent?.trim();
            const artistId = artistLink.href.match(/\/(?:album-artists|artists)\/([^/?]+)/)?.[1];
            if (artistName) {
              artists.push({ artistName, artistId });
              console.log(`🎤 Extracted artist: ${artistName}`);
            }
          }
        });

        // Determine context type based on what we found
        if (albums.length > 0) {
          if (albums.length === 1) {
            context.type = 'album';
            context.albumName = albums[0].albumName;
            context.albumId = albums[0].albumId;
            console.log(`✅ Detected single album: ${albums[0].albumName}`);
          } else {
            context.type = 'albums';
            context.items = albums;
            console.log(`✅ Detected ${albums.length} albums`);
          }
          return context;
        }

        if (artists.length > 0) {
          if (artists.length === 1) {
            context.type = 'artist';
            context.artistName = artists[0].artistName;
            context.artistId = artists[0].artistId;
            console.log(`✅ Detected single artist: ${artists[0].artistName}`);
          } else {
            context.type = 'artists';
            context.items = artists;
            console.log(`✅ Detected ${artists.length} artists`);
          }
          return context;
        }
      }
    }

    // Check for album page
    if (window.location.href.includes('/albums/')) {
      const albumTitle = document.querySelector('h1, [class*="title"], .mantine-Title-root')?.textContent?.trim();
      const albumArtist = document.querySelector('[class*="artist"] a, .mantine-Text-root a')?.textContent?.trim();
      const albumId = window.location.href.match(/\/albums\/([^/?]+)/)?.[1];

      if (albumTitle || albumId) {
        context.type = 'album';
        context.albumName = albumTitle;
        context.artistName = albumArtist;
        context.albumId = albumId;
        console.log(`✅ Detected album context: ${albumTitle} by ${albumArtist}`);
        return context;
      }
    }

    // Check for artist page
    if (window.location.href.includes('/artists/') || window.location.href.includes('/album-artists/')) {
      const artistName = document.querySelector('h1, .mantine-Title-root, ._detail-container_1ncsa_83 a')?.textContent?.trim();
      const artistId = window.location.href.match(/\/(?:artists|album-artists)\/([^/?]+)/)?.[1];

      if (artistName || artistId) {
        context.type = 'artist';
        context.artistName = artistName;
        context.artistId = artistId;
        console.log(`✅ Detected artist context: ${artistName}`);
        return context;
      }
    }

    // Fallback: try to get any context from the page
    console.log("⚠️ Could not determine specific context, using general mode");
    console.log("Available h1 elements:", Array.from(document.querySelectorAll('h1')).map(h => h.textContent));

    return context;
  }

  /**
   * Extract song information from an AG Grid row (Feishin's table format)
   */
  static extractSongFromAGGridRow(row) {
    try {
      // AG Grid structure: find cells by col-id
      const titleCell = row.querySelector('[col-id="titleCombined"]');
      const albumCell = row.querySelector('[col-id="album"]');

      if (!titleCell) return null;

      // Extract title from the metadata wrapper
      const title = titleCell.querySelector('._metadata-wrapper_ypsy4_34 > div:first-child')?.textContent?.trim();

      // Extract artist from the metadata wrapper (second div, link)
      const artist = titleCell.querySelector('._metadata-wrapper_ypsy4_34 a')?.textContent?.trim();

      // Extract album from the album cell
      const album = albumCell?.querySelector('a')?.textContent?.trim();

      if (!title) return null;

      const songInfo = {
        title: title || '',
        artist: artist || 'Unknown Artist',
        album: album || 'Unknown Album'
      };

      console.log("🎵 Extracted song:", songInfo);
      return songInfo;
    } catch (e) {
      console.warn("⚠️ Error extracting song from AG Grid row:", e);
      return null;
    }
  }
}

