import express, { Request, Response } from 'express';
import * as path from 'path';
import { config } from './config';
import { TTSService } from './services/tts.service';
import { ProviderName, AudioFormat } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const ttsService = new TTSService(config);

// Serve static files from web directory
app.use('/static', express.static(path.join(__dirname, 'web')));

// Serve the main web UI
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// API: Get configured providers
app.get('/api/providers', (_req: Request, res: Response) => {
  try {
    const configured = ttsService.getConfiguredProviders();
    const defaultProvider = ttsService.getDefaultProvider();

    const providers = configured.map((name) => ({
      name,
      isDefault: name === defaultProvider,
      parameters: getProviderParameters(name),
    }));

    res.json({ providers, default: defaultProvider });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// API: Get voices
app.get('/api/voices', async (req: Request, res: Response) => {
  try {
    const provider = req.query.provider as ProviderName | undefined;
    const voices = await ttsService.listVoices(provider);

    res.json({ voices });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// API: Synthesize text to speech
app.post('/api/synthesize', async (req: Request, res: Response) => {
  try {
    const {
      text,
      provider,
      voiceId,
      format = 'mp3',
      stability,
      similarityBoost,
      style,
      speed,
      pitch,
    } = req.body;

    if (!text || !voiceId) {
      res.status(400).json({ error: 'Text and voiceId are required' });
      return;
    }

    const result = await ttsService.synthesize(text, {
      provider: provider as ProviderName,
      voiceId,
      format: format as AudioFormat,
      stability,
      similarityBoost,
      style,
      speed,
      pitch,
    });

    // Set appropriate content type
    const contentType = format === 'wav' ? 'audio/wav' : 'audio/mpeg';
    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `attachment; filename="tts_output.${format}"`);
    res.send(result.audio);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Helper: Get provider-specific parameters
function getProviderParameters(provider: ProviderName) {
  switch (provider) {
    case 'elevenlabs':
      return [
        { name: 'stability', label: 'Stability', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5 },
        { name: 'similarityBoost', label: 'Similarity Boost', type: 'range', min: 0, max: 1, step: 0.01, default: 0.75 },
        { name: 'style', label: 'Style', type: 'range', min: 0, max: 1, step: 0.01, default: 0 },
      ];
    case 'varco':
      return [
        { name: 'speed', label: 'Speed', type: 'range', min: 0.5, max: 2, step: 0.1, default: 1.0 },
        { name: 'pitch', label: 'Pitch', type: 'range', min: -20, max: 20, step: 1, default: 0 },
      ];
    default:
      return [];
  }
}

app.listen(PORT, () => {
  console.log(`TTS Hub Web UI running at http://localhost:${PORT}`);
  console.log(`Configured providers: ${ttsService.getConfiguredProviders().join(', ')}`);
});
