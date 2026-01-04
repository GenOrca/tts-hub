import { BaseProvider } from './base';
import {
  ProviderConfig,
  ProviderName,
  Voice,
  SynthesizeOptions,
  SynthesizeResult,
  AudioFormat,
} from '../types';

interface VarcoVoice {
  speaker_uuid: string;
  speaker_name: string;
  language: string;
  gender?: string;
  sample_url?: string;
  description?: string;
}

// Varco returns voices as a direct array, not wrapped in an object

interface VarcoSynthesisRequest {
  text: string;
  voice: string;
  language?: 'korean' | 'english' | 'japanese' | 'taiwanese';
  properties?: {
    speed?: number;
    pitch?: number;
  };
  n_fm_steps?: number;
  seed?: number;
  return_metadata?: boolean;
}

interface VarcoSynthesisResponse {
  audio: string; // Base64-encoded WAV data
  ssml?: string;
  metadata?: unknown;
}

export class VarcoProvider extends BaseProvider {
  readonly name: ProviderName = 'varco';

  constructor(config: ProviderConfig) {
    super({
      ...config,
      apiUrl: config.apiUrl || 'https://openapi.ai.nc.com',
    });
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      openapi_key: this.config.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async synthesize(text: string, options: SynthesizeOptions): Promise<SynthesizeResult> {
    // Varco API returns WAV format only
    const format: AudioFormat = 'wav';

    try {
      // Varco pitch range is 0.5-1.5 (default 1.0), speed range is similar
      // Convert from CLI pitch (-20 to 20) to Varco pitch (0.5 to 1.5) if needed
      let pitch = options.pitch ?? 1.0;
      if (pitch < 0.5 || pitch > 1.5) {
        // If pitch seems to be in -20 to 20 range, use default
        pitch = 1.0;
      }

      let speed = options.speed ?? 1.0;
      if (speed < 0.5 || speed > 2.0) {
        speed = 1.0;
      }

      const requestBody: VarcoSynthesisRequest = {
        text,
        voice: options.voiceId,
        properties: {
          speed,
          pitch,
        },
      };

      const response = await this.client.post<VarcoSynthesisResponse>(
        '/tts/standard/v1/api/synthesize',
        requestBody,
        {
          responseType: 'json',
        }
      );

      if (!response.data.audio) {
        throw new Error('No audio data received from Varco API');
      }

      const audioBuffer = Buffer.from(response.data.audio, 'base64');

      return {
        audio: audioBuffer,
        format,
        provider: this.name,
      };
    } catch (error) {
      this.handleError(error, 'Text-to-speech synthesis');
    }
  }

  async listVoices(): Promise<Voice[]> {
    try {
      const response = await this.client.get<VarcoVoice[]>(
        '/tts/standard/v1/api/voices/varco'
      );

      // Varco returns voices as a direct array
      return response.data.map((voice) => this.mapVoice(voice));
    } catch (error) {
      this.handleError(error, 'List voices');
    }
  }

  async getVoice(voiceId: string): Promise<Voice | null> {
    try {
      // Varco doesn't have a single voice endpoint, so we fetch all and filter
      const voices = await this.listVoices();
      return voices.find((v) => v.id === voiceId) || null;
    } catch (error) {
      this.handleError(error, 'Get voice');
    }
  }

  private mapVoice(voice: VarcoVoice): Voice {
    return {
      id: voice.speaker_uuid || voice.speaker_name,
      name: voice.speaker_name,
      language: voice.language,
      gender: this.mapGender(voice.gender),
      provider: this.name,
      previewUrl: voice.sample_url,
      description: voice.description,
    };
  }

  private mapGender(gender?: string): 'male' | 'female' | 'neutral' | undefined {
    if (!gender) return undefined;
    const lower = gender.toLowerCase();
    if (lower === 'male' || lower === 'm') return 'male';
    if (lower === 'female' || lower === 'f') return 'female';
    return 'neutral';
  }
}
