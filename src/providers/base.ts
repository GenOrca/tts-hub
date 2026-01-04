import axios, { AxiosInstance } from 'axios';
import {
  TTSProvider,
  ProviderName,
  ProviderConfig,
  Voice,
  SynthesizeOptions,
  SynthesizeResult,
} from '../types';

export abstract class BaseProvider implements TTSProvider {
  abstract readonly name: ProviderName;

  protected client: AxiosInstance;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: this.getDefaultHeaders(),
    });
  }

  protected abstract getDefaultHeaders(): Record<string, string>;

  abstract synthesize(text: string, options: SynthesizeOptions): Promise<SynthesizeResult>;

  abstract listVoices(): Promise<Voice[]>;

  abstract getVoice(voiceId: string): Promise<Voice | null>;

  async isAvailable(): Promise<boolean> {
    try {
      await this.listVoices();
      return true;
    } catch {
      return false;
    }
  }

  protected handleError(error: unknown, operation: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 401) {
        throw new Error(`[${this.name}] Authentication failed: Invalid API key`);
      }
      if (status === 429) {
        throw new Error(`[${this.name}] Rate limit exceeded. Please try again later.`);
      }
      if (status === 400) {
        throw new Error(`[${this.name}] Bad request: ${message}`);
      }

      throw new Error(`[${this.name}] ${operation} failed: ${message}`);
    }

    throw new Error(`[${this.name}] ${operation} failed: ${String(error)}`);
  }
}
