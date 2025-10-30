/**
 * Context Menu Interceptor
 * Intercepts Feishin's context menu events to capture track/album/artist data
 */

export class ContextMenuInterceptor {
    constructor() {
        this.currentContextData = null;
        // Store instance globally for the interceptor function to access
        window.__contextInterceptorInstance = this;
        this.interceptEventSystem();
        this.setupWindowExport();
        console.log("🎯 Context Menu Interceptor initialized");
    }

    /**
     * Intercept the custom event system used by Feishin
     */
    interceptEventSystem() {
        // Store original dispatchEvent
        const originalDispatchEvent = EventTarget.prototype.dispatchEvent;

        EventTarget.prototype.dispatchEvent = function(event) {
            // Intercept context menu events
            if (event.type === 'context-menu:openContextMenu') {
                // Call handler but don't let it dispatch events (avoid recursion)
                try {
                    window.__contextInterceptorInstance?.handleContextMenuOpen(event);
                } catch (e) {
                    console.error("Error in context menu interceptor:", e);
                }
            }

            // Call original with proper context binding
            return originalDispatchEvent.call(this, event);
        };

        console.log("✅ Event system intercepted");
    }

    /**
     * Handle context menu open event
     */
    handleContextMenuOpen(event) {
        const detail = event.detail;

        if (!detail || !detail.data) {
            console.warn("⚠️ Context menu opened without data");
            return;
        }

        // Extract and store context data
        this.currentContextData = {
            type: detail.type,
            data: detail.data,
            dataNodes: detail.dataNodes,
            context: detail.context,
            timestamp: Date.now(),
            menuItems: detail.menuItems?.map(item => item.id),
        };

        // Log the captured data
        this.logContextData();

        // Create and dispatch custom event using a native CustomEvent
        // (avoiding the intercepted dispatchEvent)
        const customEvent = new CustomEvent('feishin-context-captured', {
            detail: this.currentContextData
        });

        // Dispatch directly on window using the original dispatchEvent
        const originalDispatch = Object.getPrototypeOf(window).dispatchEvent;
        originalDispatch.call(window, customEvent);
    }

    /**
     * Log captured context data in a readable format
     */
    logContextData() {
        const { type, data } = this.currentContextData;

        console.group("🎵 Context Menu Data Captured");
        console.log("%cContext Type: " + type, "color: cyan; font-weight: bold");
        console.log("Item count:", data.length);

        if (data.length > 0) {
            const firstItem = data[0];

            // Determine what was actually clicked
            let clickedOn = type;
            if (type === 'song') clickedOn = '🎵 Track';
            else if (type === 'album') clickedOn = '💿 Album';
            else if (type === 'albumArtist' || type === 'artist') clickedOn = '🎤 Artist';
            else if (type === 'playlist') clickedOn = '📋 Playlist';

            console.log("%cClicked on: " + clickedOn, "color: lime; font-weight: bold");

            // If multiple items, show all of them
            if (data.length > 1) {
                console.log("%c" + data.length + " items selected:", "color: yellow; font-weight: bold");
                data.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.name}` +
                        (item.album ? ` - ${item.album}` : '') +
                        (item.artistItems?.[0]?.name ? ` - ${item.artistItems[0].name}` : ''));
                });
            } else {
                // Single item - show detailed info
                console.log("Name:", firstItem.name);

                // Show type-specific info
                if (type === 'song') {
                    console.log("Artist:", firstItem.artistItems?.[0]?.name || firstItem.artists?.[0]?.name);
                    console.log("Album:", firstItem.album);
                } else if (type === 'album') {
                    console.log("Artists:", firstItem.albumArtists?.map(a => a.name).join(', '));
                    console.log("Tracks:", firstItem.songCount);
                } else if (type === 'albumArtist' || type === 'artist') {
                    console.log("Albums:", firstItem.albumCount);
                }
            }

            console.log("Full data:", data);
        }

        console.groupEnd();
    }

    /**
     * Get the current context data
     */
    getCurrentContext() {
        return this.currentContextData;
    }

    /**
     * Get specific item data by index
     */
    getItemByIndex(index = 0) {
        if (!this.currentContextData || !this.currentContextData.data) {
            return null;
        }
        return this.currentContextData.data[index];
    }

    /**
     * Get all items
     */
    getAllItems() {
        if (!this.currentContextData || !this.currentContextData.data) {
            return [];
        }
        return this.currentContextData.data;
    }

    /**
     * Export to window for easy access from other scripts
     */
    setupWindowExport() {
        window.feishinContextInterceptor = {
            getCurrent: () => this.getCurrentContext(),
            getItem: (index) => this.getItemByIndex(index),
            getAll: () => this.getAllItems(),
            // Helper methods for common use cases
            getTrackInfo: () => {
                const item = this.getItemByIndex(0);
                if (!item) return null;

                return {
                    id: item.id,
                    name: item.name,
                    title: item.name,
                    artist: item.artistItems?.[0]?.name || item.artists?.[0]?.name,
                    album: item.album,
                    albumId: item.albumId,
                    duration: item.duration,
                    genre: item.genre,
                    year: item.year,
                    albumArtists: item.albumArtists,
                    itemType: item.itemType,
                    serverId: item.serverId,
                };
            },
            getAlbumInfo: () => {
                const item = this.getItemByIndex(0);
                if (!item) return null;

                return {
                    id: item.id,
                    name: item.name,
                    albumArtists: item.albumArtists,
                    artists: item.artists,
                    genres: item.genres,
                    year: item.year,
                    songCount: item.songCount,
                    duration: item.duration,
                    itemType: item.itemType,
                    serverId: item.serverId,
                };
            },
            getArtistInfo: () => {
                const item = this.getItemByIndex(0);
                if (!item) return null;

                return {
                    id: item.id,
                    name: item.name,
                    albumCount: item.albumCount,
                    genres: item.genres,
                    itemType: item.itemType,
                    serverId: item.serverId,
                };
            }
        };

        console.log("✅ Window export setup complete. Access via: window.feishinContextInterceptor");
    }
}

