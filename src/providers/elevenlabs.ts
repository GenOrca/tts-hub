import { BaseProvider } from './base';
import {
  ProviderConfig,
  ProviderName,
  Voice,
  SynthesizeOptions,
  SynthesizeResult,
  AudioFormat,
} from '../types';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: {
    gender?: string;
    age?: string;
    accent?: string;
    description?: string;
  };
  preview_url?: string;
  description?: string;
}

interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
}

export class ElevenLabsProvider extends BaseProvider {
  readonly name: ProviderName = 'elevenlabs';

  private formatMap: Record<AudioFormat, string> = {
    mp3: 'mp3_44100_128',
    wav: 'pcm_44100',
    pcm: 'pcm_44100',
    ogg: 'mp3_44100_128',
  };

  constructor(config: ProviderConfig) {
    super({
      ...config,
      apiUrl: config.apiUrl || 'https://api.elevenlabs.io/v1',
    });
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      'xi-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async synthesize(text: string, options: SynthesizeOptions): Promise<SynthesizeResult> {
    const format = options.format || 'mp3';
    const outputFormat = this.formatMap[format];

    try {
      const response = await this.client.post(
        `/text-to-speech/${options.voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: options.stability ?? 0.5,
            similarity_boost: options.similarityBoost ?? 0.75,
            style: options.style ?? 0,
            use_speaker_boost: true,
          },
        },
        {
          params: { output_format: outputFormat },
          responseType: 'arraybuffer',
        }
      );

      return {
        audio: Buffer.from(response.data),
        format,
        provider: this.name,
      };
    } catch (error) {
      this.handleError(error, 'Text-to-speech synthesis');
    }
  }

  async listVoices(): Promise<Voice[]> {
    try {
      const response = await this.client.get<ElevenLabsVoicesResponse>('/voices');

      return response.data.voices.map((voice) => this.mapVoice(voice));
    } catch (error) {
      this.handleError(error, 'List voices');
    }
  }

  async getVoice(voiceId: string): Promise<Voice | null> {
    try {
      const response = await this.client.get<ElevenLabsVoice>(`/voices/${voiceId}`);
      return this.mapVoice(response.data);
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      this.handleError(error, 'Get voice');
    }
  }

  private mapVoice(voice: ElevenLabsVoice): Voice {
    return {
      id: voice.voice_id,
      name: voice.name,
      gender: this.mapGender(voice.labels?.gender),
      provider: this.name,
      previewUrl: voice.preview_url,
      description: voice.description || voice.labels?.description,
    };
  }

  private mapGender(gender?: string): 'male' | 'female' | 'neutral' | undefined {
    if (!gender) return undefined;
    const lower = gender.toLowerCase();
    if (lower === 'male') return 'male';
    if (lower === 'female') return 'female';
    return 'neutral';
  }
}
