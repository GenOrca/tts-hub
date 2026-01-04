// TTS Hub - Multi-provider Text-to-Speech Service

export * from './types';
export * from './config';
export * from './providers';
export { TTSService } from './services/tts.service';

// Default export for quick usage
import { config } from './config';
import { TTSService } from './services/tts.service';

export const tts = new TTSService(config);
export default tts;
