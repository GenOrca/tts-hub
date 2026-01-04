import * as fs from 'fs';
import * as path from 'path';
import {
  TTSProvider,
  TTSConfig,
  ProviderName,
  Voice,
  SynthesizeOptions,
  SynthesizeResult,
} from '../types';
import { createProvider, getAvailableProviders, isValidProvider } from '../providers';

export class TTSService {
  private providers: Map<ProviderName, TTSProvider> = new Map();
  private config: TTSConfig;
  private defaultProvider: ProviderName;

  constructor(config: TTSConfig) {
    this.config = config;
    this.defaultProvider = config.defaultProvider;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const providerConfigs = this.config.providers;

    if (providerConfigs.elevenlabs) {
      this.providers.set('elevenlabs', createProvider('elevenlabs', providerConfigs.elevenlabs));
    }

    if (providerConfigs.varco) {
      this.providers.set('varco', createProvider('varco', providerConfigs.varco));
    }

    if (this.providers.size === 0) {
      console.warn('Warning: No TTS providers configured. Please set API keys in .env file.');
    }
  }

  getProvider(name?: ProviderName): TTSProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      const available = Array.from(this.providers.keys()).join(', ');
      throw new Error(
        `Provider "${providerName}" is not configured. Available providers: ${available || 'none'}`
      );
    }

    return provider;
  }

  async synthesize(
    text: string,
    options: SynthesizeOptions & { provider?: ProviderName }
  ): Promise<SynthesizeResult> {
    const provider = this.getProvider(options.provider);
    return provider.synthesize(text, options);
  }

  async synthesizeToFile(
    text: string,
    options: SynthesizeOptions & { provider?: ProviderName; outputPath?: string }
  ): Promise<string> {
    const result = await this.synthesize(text, options);

    const outputDir = this.config.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename =
      options.outputPath ||
      path.join(outputDir, `tts_${Date.now()}.${result.format}`);

    fs.writeFileSync(filename, result.audio);
    return filename;
  }

  async listVoices(providerName?: ProviderName): Promise<Voice[]> {
    if (providerName) {
      const provider = this.getProvider(providerName);
      return provider.listVoices();
    }

    const allVoices: Voice[] = [];

    for (const provider of this.providers.values()) {
      try {
        const voices = await provider.listVoices();
        allVoices.push(...voices);
      } catch (error) {
        console.warn(`Failed to fetch voices from ${provider.name}:`, error);
      }
    }

    return allVoices;
  }

  async getVoice(voiceId: string, providerName?: ProviderName): Promise<Voice | null> {
    if (providerName) {
      const provider = this.getProvider(providerName);
      return provider.getVoice(voiceId);
    }

    for (const provider of this.providers.values()) {
      try {
        const voice = await provider.getVoice(voiceId);
        if (voice) return voice;
      } catch {
        continue;
      }
    }

    return null;
  }

  getConfiguredProviders(): ProviderName[] {
    return Array.from(this.providers.keys());
  }

  getAllProviders(): ProviderName[] {
    return getAvailableProviders();
  }

  isProviderConfigured(name: ProviderName): boolean {
    return this.providers.has(name);
  }

  setDefaultProvider(name: ProviderName): void {
    if (!isValidProvider(name)) {
      throw new Error(`Invalid provider: ${name}`);
    }
    if (!this.providers.has(name)) {
      throw new Error(`Provider "${name}" is not configured`);
    }
    this.defaultProvider = name;
  }

  getDefaultProvider(): ProviderName {
    return this.defaultProvider;
  }
}
