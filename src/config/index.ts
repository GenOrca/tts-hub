import * as dotenv from 'dotenv';
import * as path from 'path';
import { TTSConfig, ProviderName } from '../types';

dotenv.config();

export function loadConfig(): TTSConfig {
  const defaultProvider = (process.env.DEFAULT_TTS_PROVIDER || 'elevenlabs') as ProviderName;
  const outputDir = process.env.OUTPUT_DIR || './output';

  return {
    defaultProvider,
    outputDir: path.resolve(outputDir),
    providers: {
      elevenlabs: process.env.ELEVENLABS_API_KEY
        ? {
            apiKey: process.env.ELEVENLABS_API_KEY,
            apiUrl: process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1',
            timeout: parseInt(process.env.ELEVENLABS_TIMEOUT || '30000', 10),
          }
        : undefined,
      varco: process.env.VARCO_API_KEY
        ? {
            apiKey: process.env.VARCO_API_KEY,
            apiUrl: process.env.VARCO_API_URL || 'https://api.varco.ai/v1',
            timeout: parseInt(process.env.VARCO_TIMEOUT || '30000', 10),
          }
        : undefined,
    },
  };
}

export const config = loadConfig();
