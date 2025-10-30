/**
 * Custom Init - Main Entry Point
 * Initializes all custom Feishin plugins and modifications
 */

import { OpenAIFieldInjector } from './openai-field-injector.js';
import { ContextMenuButton } from './context-menu-button.js';
import { SongFetcher } from './song-fetcher.js';
import { ContextMenuInterceptor } from './context-menu-interceptor.js';

console.log("🎨 custom-init.js injected");

// Initialize context menu interceptor (captures context menu events)
new ContextMenuInterceptor();

// Initialize OpenAI field injector (runs independently)
new OpenAIFieldInjector();

// Initialize API test (only runs if authenticated)
new SongFetcher();

// Initialize context menu button
new ContextMenuButton();

