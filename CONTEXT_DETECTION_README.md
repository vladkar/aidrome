# Feishin Context Detection System

## Overview

This system intercepts and captures context menu data from Feishin to understand which track, album, or artist was clicked. It provides multiple strategies to detect the current music context.

## Components

### 1. **ContextMenuInterceptor** (`context-menu-interceptor.js`)
- **Purpose**: Intercepts Feishin's custom event system to capture context menu data
- **How it works**: Hooks into `EventTarget.dispatchEvent` to catch `context-menu:openContextMenu` events
- **Data captured**: Track/album/artist info, menu items, selection data

### 2. **ContextDetector** (`context-detector.js`)
- **Purpose**: Advanced context detection using multiple strategies
- **Strategies**:
  - Context menu events (from ContextMenuInterceptor)
  - URL pattern matching (album/artist detail pages)
  - Currently playing track monitoring
  - DOM interaction monitoring (clicks, hovers)

### 3. **DebugContext** (`debug-context.js`)
- **Purpose**: Debug utilities and visual panel for testing
- **Features**: Console commands, visual debug panel, formatted output

## Usage

### Quick Start

1. **Right-click** on any track, album, or artist in Feishin
2. Open browser console (F12)
3. Use debug commands:

```javascript
// Get current track info
feishinDebug.getTrack()

// Get current album info
feishinDebug.getAlbum()

// Get current artist info
feishinDebug.getArtist()

// Get all selected items (multi-select)
feishinDebug.getAll()

// Show all available fields
feishinDebug.showFields()

// Show help
feishinDebug.help()

// Toggle debug panel
feishinDebug.togglePanel()
```

### Programmatic Access

#### Using the Interceptor API

```javascript
// Get current context data
const context = window.feishinContextInterceptor.getCurrent();
console.log(context);
// {
//   type: "SONG",
//   data: [...],
//   dataNodes: [...],
//   timestamp: 1234567890,
//   menuItems: ["play", "addToPlaylist", ...]
// }

// Get formatted track info
const track = window.feishinContextInterceptor.getTrackInfo();
console.log(track);
// {
//   id: "abc123",
//   name: "Song Name",
//   artist: "Artist Name",
//   album: "Album Name",
//   albumId: "xyz789",
//   duration: 180,
//   genre: "Rock",
//   year: 2020
// }

// Get formatted album info
const album = window.feishinContextInterceptor.getAlbumInfo();

// Get formatted artist info
const artist = window.feishinContextInterceptor.getArtistInfo();

// Get specific item by index (for multi-select)
const item = window.feishinContextInterceptor.getItem(0);

// Get all selected items
const allItems = window.feishinContextInterceptor.getAll();
```

#### Listening to Context Changes

```javascript
// Listen for context menu captures
window.addEventListener('feishin-context-captured', (event) => {
    const contextData = event.detail;
    console.log('Context captured:', contextData);
    
    const firstItem = contextData.data[0];
    console.log('Item name:', firstItem.name);
    console.log('Item type:', contextData.type);
});
```

### Example Integration

Here's how you might use this in your own plugin:

```javascript
class MyFeishinPlugin {
    constructor() {
        this.setupContextListener();
    }
    
    setupContextListener() {
        window.addEventListener('feishin-context-captured', (event) => {
            const { type, data } = event.detail;
            
            if (type === 'SONG' && data.length === 1) {
                const track = data[0];
                this.handleTrackSelected(track);
            } else if (type === 'ALBUM') {
                const album = data[0];
                this.handleAlbumSelected(album);
            }
        });
    }
    
    handleTrackSelected(track) {
        console.log('Track selected:', track.name);
        console.log('Artist:', track.artistItems?.[0]?.name);
        console.log('Album:', track.album);
        
        // Do something with track data
        // e.g., fetch lyrics, analyze audio, etc.
    }
    
    handleAlbumSelected(album) {
        console.log('Album selected:', album.name);
        console.log('Artists:', album.albumArtists);
        
        // Do something with album data
    }
}

// Initialize your plugin
new MyFeishinPlugin();
```

## Available Data Fields

### Song/Track Data
```javascript
{
    id: string,              // Unique track ID
    name: string,            // Track name/title
    album: string,           // Album name
    albumId: string,         // Album ID
    artistItems: [...],      // Array of artist objects
    albumArtists: [...],     // Array of album artist objects
    duration: number,        // Duration in seconds
    genre: string,           // Genre
    year: number,            // Release year
    userRating: number,      // User rating (0-5)
    userFavorite: boolean,   // Is favorited
    playCount: number,       // Play count
    serverId: string,        // Server ID
    itemType: "SONG",        // Item type
    // ... many more fields available
}
```

### Album Data
```javascript
{
    id: string,              // Unique album ID
    name: string,            // Album name
    albumArtists: [...],     // Array of album artist objects
    artists: [...],          // Array of artist objects
    genres: [...],           // Array of genres
    year: number,            // Release year
    songCount: number,       // Number of tracks
    duration: number,        // Total duration
    userRating: number,      // User rating
    serverId: string,        // Server ID
    itemType: "ALBUM",       // Item type
    // ... many more fields available
}
```

### Artist Data
```javascript
{
    id: string,              // Unique artist ID
    name: string,            // Artist name
    albumCount: number,      // Number of albums
    genres: [...],           // Array of genres
    serverId: string,        // Server ID
    itemType: "ARTIST",      // Item type
    // ... many more fields available
}
```

## Debug Panel

The visual debug panel appears in the bottom-right corner when you right-click on items. It shows:
- Item type (SONG/ALBUM/ARTIST)
- Number of items selected
- Key information (name, album, artist, etc.)
- Available menu actions

Toggle it with: `feishinDebug.togglePanel()`

## How It Works

### Event Interception Strategy

Feishin uses a custom event system based on the pattern:
```
createUseExternalEvents → createEvent → dispatchEvent
```

When you right-click on an item, Feishin calls:
```javascript
openContextMenu({
    data: [/* array of selected items */],
    type: LibraryItem.SONG | ALBUM | ARTIST,
    menuItems: [/* available menu items */],
    xPos: number,
    yPos: number,
    // ... more context data
})
```

Our interceptor hooks into `EventTarget.prototype.dispatchEvent` to capture this event before it reaches Feishin's context menu provider.

## Troubleshooting

### "No context captured yet"
- Make sure you've right-clicked on a track/album/artist
- The context menu must actually open for data to be captured

### "undefined" values
- Not all items have all fields (e.g., artists don't have `albumId`)
- Check available fields with `feishinDebug.showFields()`

### Data seems outdated
- The interceptor captures data when the context menu opens
- Right-click again to refresh the captured data

## Advanced Usage

### Multi-Select Support

When multiple items are selected:

```javascript
const allItems = window.feishinContextInterceptor.getAll();
console.log(`${allItems.length} items selected`);

allItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.name}`);
});
```

### Type Checking

```javascript
const context = window.feishinContextInterceptor.getCurrent();

switch (context.type) {
    case 'SONG':
        // Handle song
        break;
    case 'ALBUM':
        // Handle album
        break;
    case 'ARTIST':
    case 'ALBUM_ARTIST':
        // Handle artist
        break;
}
```

### Integration with Other Plugins

```javascript
// In your plugin initialization
import { ContextMenuInterceptor } from './context-menu-interceptor.js';

// The interceptor is already initialized in custom-init.js
// Just listen for events or use the window API

window.addEventListener('feishin-context-captured', (e) => {
    const track = e.detail.data[0];
    // Use track data in your plugin
    this.myCustomFunction(track);
});
```

## Notes

- The interceptor must be initialized **before** any context menu opens
- Data is captured in real-time when the context menu is triggered
- The system is non-invasive and doesn't modify Feishin's original behavior
- All captured data comes directly from Feishin's internal state

## Next Steps

Use this system to:
- Build custom context menu items
- Fetch additional data (lyrics, artist info, etc.)
- Integrate with external APIs
- Create custom visualizations
- Implement smart playlists
- And much more!

