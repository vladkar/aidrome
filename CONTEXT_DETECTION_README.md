# Feishin Context Detection System

## Overview

This system intercepts and captures context menu data from Feishin to understand which track, album, or artist was clicked.

## Components

### 1. **ContextMenuInterceptor** (`context-menu-interceptor.js`)
- Intercepts Feishin's custom event system to capture context menu data
- Prints selected items to console automatically
- Provides API for programmatic access

### 2. **ContextDetector** (`context-detector.js`)
- Provides standardized API for accessing context data
- Methods: `getCurrentContext()`, `getItems()`, `getFirstItem()`

## Usage

### Console Output

When you right-click on items, the console automatically shows:

**Single item:**
```
🎵 Never Gonna Give You Up - Rick Astley
```

**Multiple items:**
```
🎵 3 items selected:
  1. Never Gonna Give You Up - Rick Astley
  2. Together Forever - Rick Astley
  3. Whenever You Need Somebody - Rick Astley
```

### Programmatic Access

```javascript
// Get current context (full data)
const context = window.feishinContextInterceptor.getCurrent();
// Returns: { type: "song", data: [...], timestamp: 123456, menuItems: [...] }

// Get all selected items
const items = window.feishinContextInterceptor.getAll();
// Returns: [{ id, name, album, artistItems, ... }]

// Get specific item
const item = window.feishinContextInterceptor.getItem(0);
// Returns: { id, name, album, artistItems, ... }
```

### Listening to Events

```javascript
window.addEventListener('feishin-context-captured', (event) => {
    const { type, data } = event.detail;
    console.log(`Selected ${type}:`, data[0].name);
});
```

### Example Integration

```javascript
// Listen for context menu events in your plugin
window.addEventListener('feishin-context-captured', (event) => {
    const { type, data } = event.detail;
    
    if (type === 'song') {
        const track = data[0];
        console.log('Track:', track.name, 'by', track.artistItems?.[0]?.name);
    } else if (type === 'album') {
        const album = data[0];
        console.log('Album:', album.name, 'by', album.albumArtists?.[0]?.name);
    }
});
```

## Available Data Fields

### Song/Track
- `id`, `name`, `album`, `albumId`
- `artistItems`, `albumArtists`, `artists`
- `duration`, `genre`, `year`
- `userRating`, `userFavorite`, `playCount`
- `serverId`, `itemType`

### Album
- `id`, `name`, `albumArtists`, `artists`
- `genres`, `year`, `songCount`, `duration`
- `userRating`, `serverId`, `itemType`

### Artist
- `id`, `name`, `albumCount`
- `genres`, `serverId`, `itemType`

## How It Works

Feishin dispatches custom events when opening context menus:
```javascript
openContextMenu({
    data: [/* selected items */],
    type: "song" | "album" | "artist",
    menuItems: [/* available actions */],
    // ...
})
```

Our interceptor hooks into `EventTarget.prototype.dispatchEvent` to capture these events.

## API Reference

### Window API
```javascript
window.feishinContextInterceptor.getCurrent()  // Get full context
window.feishinContextInterceptor.getAll()      // Get all items
window.feishinContextInterceptor.getItem(0)    // Get specific item
```

### Event API
```javascript
window.addEventListener('feishin-context-captured', (e) => {
    // e.detail = { type, data, timestamp, menuItems }
});
```

## Notes

- Context is captured when you right-click or open context menu
- Data is logged to console automatically  
- Access via `window.feishinContextInterceptor` API for programmatic use
- Not all items have all fields (e.g., artists don't have `albumId`)
