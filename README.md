# TTS Hub

A multi-provider Text-to-Speech service that provides a unified interface for converting text to natural-sounding speech audio. Supports multiple TTS providers (ElevenLabs, Varco Voice) through a consistent CLI, Web UI, and programmatic API.

## Features

- **Multi-Provider Support** - Seamlessly switch between ElevenLabs and Varco Voice APIs
- **CLI Interface** - Command-line tools for synthesis, voice listing, and provider testing
- **Web UI** - Browser-based interface with voice selection, parameter tuning, and synthesis history
- **REST API** - HTTP endpoints for integration into other applications
- **Voice Parameters** - Provider-specific tuning (stability, pitch, speed, etc.)
- **Multiple Audio Formats** - Support for MP3, WAV, PCM, and OGG

## Installation

```bash
npm install
```

## Configuration

Copy the example environment file and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your provider credentials:

```env
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Varco Voice Configuration
VARCO_API_KEY=your_varco_api_key_here

# Service Configuration
DEFAULT_TTS_PROVIDER=elevenlabs
OUTPUT_DIR=./output
PORT=3000
```

## Usage

### CLI Commands

```bash
# Synthesize text to speech
npm run tts -- speak "Hello world" -v <voice-id> -p elevenlabs

# List available voices
npm run tts -- voices

# Show configured providers
npm run tts -- providers

# Test provider connection
npm run tts -- test -p elevenlabs
```

### Web Server

Start the web UI server:

```bash
npm run serve
```

Open http://localhost:3000 in your browser.

### Development

```bash
# Run with TypeScript support
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run compiled version
npm start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/providers` | GET | List configured providers |
| `/api/voices` | GET | List available voices (optional `?provider=` filter) |
| `/api/synthesize` | POST | Generate speech audio |

### Synthesize Request

```json
{
  "text": "Hello world",
  "provider": "elevenlabs",
  "voiceId": "voice-id-here",
  "options": {
    "stability": 0.5,
    "similarityBoost": 0.75
  }
}
```

## Project Structure

```
tts-hub/
├── src/
│   ├── cli.ts              # CLI command interface
│   ├── server.ts           # Express web server
│   ├── config/             # Configuration loading
│   ├── types/              # TypeScript type definitions
│   ├── providers/          # TTS provider implementations
│   │   ├── base.ts         # Abstract base provider
│   │   ├── elevenlabs.ts   # ElevenLabs implementation
│   │   └── varco.ts        # Varco Voice implementation
│   ├── services/           # Core TTS service
│   └── web/                # Web UI assets
├── dist/                   # Compiled JavaScript
├── .env.example            # Environment template
└── package.json
```

## Supported Providers

### ElevenLabs

Voice parameters:
- `stability` - Voice consistency (0-1)
- `similarityBoost` - Voice similarity enhancement (0-1)
- `style` - Speaking style intensity (0-1)

### Varco Voice

Voice parameters:
- `speed` - Speech rate adjustment
- `pitch` - Voice pitch modification

## License

MIT License - See [LICENSE](LICENSE) for details.