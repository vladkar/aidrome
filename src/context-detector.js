/**
 * Context Detector
 * Advanced detection of current music context through multiple strategies
 */

export class ContextDetector {
    constructor() {
        this.currentContext = null;
        this.lastKnownItem = null;
        this.setupStrategies();
        console.log("🔍 Context Detector initialized");
    }

    /**
     * Setup multiple detection strategies
     */
    setupStrategies() {
        // Strategy 1: Listen to context menu interceptor
        window.addEventListener('feishin-context-captured', (e) => {
            this.handleContextMenuCapture(e.detail);
        });

        // Strategy 2: Monitor URL changes for detail pages
        this.monitorUrlChanges();

        // Strategy 3: Monitor playing track
        this.monitorCurrentTrack();

        // Strategy 4: Monitor hovering/clicking
        this.setupDomMonitoring();
    }

    /**
     * Handle context menu capture from interceptor
     */
    handleContextMenuCapture(contextData) {
        this.currentContext = {
            source: 'context-menu',
            type: contextData.type,
            items: contextData.data,
            timestamp: contextData.timestamp,
        };

        this.lastKnownItem = contextData.data[0];

        console.log("📍 Context updated from context menu:", {
            type: this.currentContext.type,
            itemName: this.lastKnownItem?.name,
            itemId: this.lastKnownItem?.id,
        });
    }

    /**
     * Monitor URL changes to detect album/artist detail pages
     */
    monitorUrlChanges() {
        let lastUrl = location.href;

        const observer = new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                this.detectFromUrl(currentUrl);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Also listen to popstate for browser navigation
        window.addEventListener('popstate', () => {
            this.detectFromUrl(location.href);
        });
    }

    /**
     * Detect context from URL
     */
    detectFromUrl(url) {
        // Match patterns like /library/albums/{id}, /library/artists/{id}, etc.
        const patterns = {
            album: /\/library\/albums\/([^/?]+)/,
            artist: /\/library\/(?:album-)?artists\/([^/?]+)/,
            playlist: /\/playlists\/([^/?]+)/,
            genre: /\/library\/genres\/([^/?]+)/,
        };

        for (const [type, pattern] of Object.entries(patterns)) {
            const match = url.match(pattern);
            if (match) {
                this.currentContext = {
                    source: 'url',
                    type: type,
                    id: match[1],
                    url: url,
                    timestamp: Date.now(),
                };

                console.log(`📍 Context detected from URL: ${type} with ID ${match[1]}`);
                return;
            }
        }
    }

    /**
     * Monitor currently playing track
     */
    monitorCurrentTrack() {
        setInterval(() => {
            try {
                // Try to access player state from window
                const playerState = this.getPlayerState();
                if (playerState && playerState.current?.song) {
                    const song = playerState.current.song;

                    // Only update if different from last known
                    if (this.lastKnownItem?.id !== song.id) {
                        this.lastKnownItem = song;
                        console.log("🎵 Now playing:", {
                            name: song.name,
                            artist: song.artistItems?.[0]?.name,
                            album: song.album,
                        });
                    }
                }
            } catch (e) {
                // Player state not accessible yet
            }
        }, 2000);
    }

    /**
     * Get player state from React component tree
     */
    getPlayerState() {
        // Try to find React Fiber nodes containing player state
        const rootElement = document.querySelector('#root');
        if (!rootElement) return null;

        // Access React internal instance
        const fiberKey = Object.keys(rootElement).find(key =>
            key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
        );

        if (!fiberKey) return null;

        try {
            let fiber = rootElement[fiberKey];
            let depth = 0;

            // Search through fiber tree for player state
            while (fiber && depth < 50) {
                if (fiber.memoizedState?.current?.song) {
                    return fiber.memoizedState;
                }

                // Check stateNode
                if (fiber.stateNode?.current?.song) {
                    return fiber.stateNode;
                }

                fiber = fiber.return;
                depth++;
            }
        } catch (e) {
            // Silent fail
        }

        return null;
    }

    /**
     * Setup DOM monitoring for clicks and hovers
     */
    setupDomMonitoring() {
        // Monitor clicks on track rows, album cards, etc.
        document.addEventListener('click', (e) => {
            this.handleDomInteraction(e.target, 'click');
        }, true);

        // Monitor context menu (right-click)
        document.addEventListener('contextmenu', (e) => {
            this.handleDomInteraction(e.target, 'contextmenu');
        }, true);
    }

    /**
     * Handle DOM interactions to extract context
     */
    handleDomInteraction(target, eventType) {
        // Find closest row or card element
        const row = target.closest('[role="row"]');
        const card = target.closest('[class*="card"]');
        const element = row || card;

        if (!element) return;

        // Try to extract data from React props
        const reactProps = this.getReactProps(element);
        if (reactProps) {
            console.log(`🖱️ DOM ${eventType} detected:`, reactProps);
        }
    }

    /**
     * Extract React props from DOM element
     */
    getReactProps(element) {
        const keys = Object.keys(element);
        const reactKey = keys.find(key =>
            key.startsWith('__reactProps') || key.startsWith('__reactFiber')
        );

        if (!reactKey) return null;

        try {
            const fiber = element[reactKey];

            // Try to find data in various locations
            if (fiber.memoizedProps?.data) {
                return fiber.memoizedProps.data;
            }

            if (fiber.pendingProps?.data) {
                return fiber.pendingProps.data;
            }

            // Navigate through fiber tree
            let currentFiber = fiber;
            let depth = 0;

            while (currentFiber && depth < 10) {
                if (currentFiber.memoizedProps?.item) {
                    return currentFiber.memoizedProps.item;
                }

                if (currentFiber.memoizedProps?.node?.data) {
                    return currentFiber.memoizedProps.node.data;
                }

                currentFiber = currentFiber.return;
                depth++;
            }
        } catch (e) {
            // Silent fail
        }

        return null;
    }

    /**
     * Get current context
     */
    getCurrentContext() {
        return this.currentContext;
    }

    /**
     * Get last known item (most recently interacted with)
     */
    getLastKnownItem() {
        return this.lastKnownItem;
    }

    /**
     * Get playing track info
     */
    getPlayingTrack() {
        const playerState = this.getPlayerState();
        return playerState?.current?.song || null;
    }
}

