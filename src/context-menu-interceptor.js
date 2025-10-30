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

        // Determine icon
        let icon = '🎵';
        if (type === 'album') icon = '💿';
        else if (type === 'albumArtist' || type === 'artist') icon = '🎤';
        else if (type === 'playlist') icon = '📋';

        // Print selected items
        if (data.length === 1) {
            const item = data[0];
            let info = `${icon} ${item.name}`;

            if (type === 'song') {
                const artist = item.artistItems?.[0]?.name || item.artists?.[0]?.name;
                info += artist ? ` - ${artist}` : '';
            } else if (type === 'album' && item.albumArtists?.[0]) {
                info += ` - ${item.albumArtists[0].name}`;
            }

            console.log(info);
        } else {
            console.log(`${icon} ${data.length} items selected:`);
            data.forEach((item, index) => {
                const artist = item.artistItems?.[0]?.name || item.albumArtists?.[0]?.name;
                console.log(`  ${index + 1}. ${item.name}${artist ? ' - ' + artist : ''}`);
            });
        }
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
            getItem: (index = 0) => this.getItemByIndex(index),
            getAll: () => this.getAllItems(),
        };
    }
}

