# aidrome
Navidrome AI playlist injection with multi-provider support

## Features

- **AI-powered playlist generation** - Right-click on any song, album, or artist to generate contextual playlists
- **Multi-provider support** - Choose between OpenAI (GPT-4o-mini) or Anthropic Claude
- **Secure key storage** - API keys are encrypted per-server using your credentials
- **Context-aware** - Generates playlists that complement your selection, not just similar music
- **Single API key** - One key per server, with provider selection

## Supported AI Providers

### OpenAI (GPT-4o-mini)
- Fast and cost-effective
- Model: `gpt-4o-mini`
- Good for quick playlist generation

### Anthropic Claude
- High-quality reasoning
- Model: `claude-3-5-sonnet-20241022`
- Excellent for nuanced music curation

## How It Works

1. Add your music server in Feishin
2. Select your preferred AI provider (OpenAI or Claude)
3. Add your API key (optional but required for playlist generation)
4. Right-click any song, album, or artist
5. Click "Generate Playlist"
6. AI analyzes your library and creates a complementary playlist

## Configuration

The AI provider and API key are stored per-server. You can:
- Switch providers at any time by editing your server settings
- Use different providers for different servers
- Keep one API key that works with your selected provider

