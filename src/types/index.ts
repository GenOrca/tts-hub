export type ProviderName = 'elevenlabs' | 'varco';

export type AudioFormat = 'mp3' | 'wav' | 'pcm' | 'ogg';

export interface Voice {
  id: string;
  name: string;
  language?: string;
  gender?: 'male' | 'female' | 'neutral';
  provider: ProviderName;
  previewUrl?: string;
  description?: string;
}

export interface SynthesizeOptions {
  voiceId: string;
  format?: AudioFormat;
  speed?: number;
  pitch?: number;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

export interface SynthesizeResult {
  audio: Buffer;
  format: AudioFormat;
  duration?: number;
  provider: ProviderName;
}

export interface ProviderConfig {
  apiKey: string;
  apiUrl?: string;
  timeout?: number;
}

export interface TTSConfig {
  defaultProvider: ProviderName;
  outputDir: string;
  providers: {
    elevenlabs?: ProviderConfig;
    varco?: ProviderConfig;
  };
}

export interface TTSProvider {
  readonly name: ProviderName;

  synthesize(text: string, options: SynthesizeOptions): Promise<SynthesizeResult>;

  listVoices(): Promise<Voice[]>;

  getVoice(voiceId: string): Promise<Voice | null>;

  isAvailable(): Promise<boolean>;
}
