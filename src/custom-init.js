/**
 * Custom Init - Main Entry Point
 * Initializes all custom Feishin plugins and modifications
 */

import { OpenAIFieldInjector } from './openai-field-injector.js';
import { ContextMenuButton } from './context-menu-button.js';
import { SongFetcher } from './song-fetcher.js';
import { ContextMenuInterceptor } from './context-menu-interceptor.js';
import { ContextDetector } from './context-detector.js';
import { DebugContext } from './debug-context.js';

console.log("🎨 custom-init.js injected");

// Initialize context menu interceptor (MUST be first to capture events)
new ContextMenuInterceptor();

// Initialize context detector (uses data from interceptor)
new ContextDetector();

// Initialize debug tools (for development/testing)
new DebugContext();

// Initialize OpenAI field injector (runs independently)
new OpenAIFieldInjector();

// Initialize API test (only runs if authenticated)
new SongFetcher();

// Initialize context menu button
new ContextMenuButton();

