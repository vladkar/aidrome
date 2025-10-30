/**
 * Debug Context
 * Debug utilities for viewing captured context menu data
 */

export class DebugContext {
    constructor() {
        this.setupConsoleCommands();
        this.createDebugPanel();
        console.log("🐛 Debug Context initialized");
    }

    /**
     * Setup console commands for easy debugging
     */
    setupConsoleCommands() {
        window.feishinDebug = {
            // Get current context from interceptor
            getContext: () => {
                const ctx = window.feishinContextInterceptor?.getCurrent();
                if (ctx) {
                    console.log("Current Context:", ctx);
                    return ctx;
                } else {
                    console.log("No context captured yet. Right-click on a track/album/artist.");
                    return null;
                }
            },

            // Get track info
            getTrack: () => {
                const track = window.feishinContextInterceptor?.getTrackInfo();
                if (track) {
                    console.table(track);
                    return track;
                } else {
                    console.log("No track selected. Right-click on a track.");
                    return null;
                }
            },

            // Get album info
            getAlbum: () => {
                const album = window.feishinContextInterceptor?.getAlbumInfo();
                if (album) {
                    console.table(album);
                    return album;
                } else {
                    console.log("No album selected. Right-click on an album.");
                    return null;
                }
            },

            // Get artist info
            getArtist: () => {
                const artist = window.feishinContextInterceptor?.getArtistInfo();
                if (artist) {
                    console.table(artist);
                    return artist;
                } else {
                    console.log("No artist selected. Right-click on an artist.");
                    return null;
                }
            },

            // Get all items in selection
            getAll: () => {
                const items = window.feishinContextInterceptor?.getAll();
                if (items && items.length > 0) {
                    console.log(`${items.length} items selected:`);
                    console.table(items.map(item => ({
                        id: item.id,
                        name: item.name,
                        type: item.itemType,
                        album: item.album,
                        artist: item.artistItems?.[0]?.name || item.albumArtists?.[0]?.name,
                    })));
                    return items;
                } else {
                    console.log("No items selected.");
                    return [];
                }
            },

            // Show available fields for current item
            showFields: () => {
                const item = window.feishinContextInterceptor?.getItem(0);
                if (item) {
                    console.log("Available fields:");
                    console.log(Object.keys(item).sort());
                    console.log("\nFull object:");
                    console.log(item);
                    return item;
                } else {
                    console.log("No item selected.");
                    return null;
                }
            },

            // Help command
            help: () => {
                console.log(`
🎵 Feishin Debug Commands:
========================

feishinDebug.getContext()  - Get current context menu data
feishinDebug.getTrack()    - Get current track info (formatted)
feishinDebug.getAlbum()    - Get current album info (formatted)
feishinDebug.getArtist()   - Get current artist info (formatted)
feishinDebug.getAll()      - Get all selected items
feishinDebug.showFields()  - Show all available fields on current item
feishinDebug.togglePanel() - Toggle debug panel
feishinDebug.help()        - Show this help

Usage:
1. Right-click on a track, album, or artist in Feishin
2. Run feishinDebug.getTrack() or other commands
3. The context data will be displayed

Direct access:
- window.feishinContextInterceptor - Raw interceptor API
                `);
            },

            // Toggle debug panel
            togglePanel: () => {
                const panel = document.getElementById('feishin-debug-panel');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            }
        };

        // Show help on init
        console.log("💡 Type 'feishinDebug.help()' for debug commands");
    }

    /**
     * Create visual debug panel
     */
    createDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'feishin-debug-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 10px;
            width: 350px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid #333;
            border-radius: 8px;
            padding: 10px;
            z-index: 999999;
            font-family: monospace;
            font-size: 11px;
            color: #0f0;
            overflow-y: auto;
            display: none;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong style="color: #0ff;">🐛 Feishin Debug</strong>
                <button onclick="document.getElementById('feishin-debug-panel').style.display='none'"
                        style="background: #333; border: none; color: #fff; cursor: pointer; padding: 2px 8px; border-radius: 3px;">✕</button>
            </div>
            <div id="debug-content" style="color: #fff; font-size: 10px;"></div>
        `;

        document.body.appendChild(panel);

        // Update panel when context changes
        window.addEventListener('feishin-context-captured', (e) => {
            this.updateDebugPanel(e.detail);
            panel.style.display = 'block';
        });
    }

    /**
     * Update debug panel content
     */
    updateDebugPanel(contextData) {
        const content = document.getElementById('debug-content');
        if (!content) return;

        const item = contextData.data[0];
        const itemCount = contextData.data.length;

        let html = `
            <div style="margin-bottom: 8px; padding: 5px; background: rgba(0,255,255,0.1); border-left: 2px solid #0ff;">
                <strong>Type:</strong> ${contextData.type}<br>
                <strong>Items:</strong> ${itemCount}
            </div>
        `;

        if (item) {
            html += `<div style="margin-bottom: 8px;">`;

            if (item.name) {
                html += `<div style="color: #fff; font-weight: bold; margin-bottom: 5px;">📌 ${item.name}</div>`;
            }

            const fields = [
                { key: 'id', label: 'ID', color: '#0ff' },
                { key: 'album', label: 'Album', color: '#ff0' },
                { key: 'artistItems[0].name', label: 'Artist', color: '#f0f' },
                { key: 'duration', label: 'Duration', color: '#0f0' },
                { key: 'genre', label: 'Genre', color: '#fa0' },
                { key: 'year', label: 'Year', color: '#0af' },
            ];

            for (const field of fields) {
                const keys = field.key.split(/[\[\]\.]+/).filter(k => k);
                let value = item;

                for (const key of keys) {
                    value = value?.[key];
                }

                if (value !== undefined && value !== null) {
                    html += `<div style="color: ${field.color};">${field.label}: ${value}</div>`;
                }
            }

            html += `</div>`;

            // Show available menu actions
            if (contextData.menuItems && contextData.menuItems.length > 0) {
                html += `<div style="margin-top: 8px; padding: 5px; background: rgba(0,255,0,0.1); border-left: 2px solid #0f0;">`;
                html += `<strong>Menu Actions:</strong><br>`;
                html += contextData.menuItems.slice(0, 5).join(', ');
                if (contextData.menuItems.length > 5) {
                    html += ` +${contextData.menuItems.length - 5} more`;
                }
                html += `</div>`;
            }
        }

        html += `
            <div style="margin-top: 10px; padding: 5px; background: rgba(255,255,255,0.05); font-size: 9px; color: #888;">
                Console: feishinDebug.help()
            </div>
        `;

        content.innerHTML = html;
    }
}

