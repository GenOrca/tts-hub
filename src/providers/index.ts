import { TTSProvider, ProviderName, ProviderConfig } from '../types';
import { ElevenLabsProvider } from './elevenlabs';
import { VarcoProvider } from './varco';

export { BaseProvider } from './base';
export { ElevenLabsProvider } from './elevenlabs';
export { VarcoProvider } from './varco';

type ProviderConstructor = new (config: ProviderConfig) => TTSProvider;

const providerRegistry: Record<ProviderName, ProviderConstructor> = {
  elevenlabs: ElevenLabsProvider,
  varco: VarcoProvider,
};

export function createProvider(name: ProviderName, config: ProviderConfig): TTSProvider {
  const ProviderClass = providerRegistry[name];

  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${name}. Available providers: ${Object.keys(providerRegistry).join(', ')}`);
  }

  return new ProviderClass(config);
}

export function getAvailableProviders(): ProviderName[] {
  return Object.keys(providerRegistry) as ProviderName[];
}

export function isValidProvider(name: string): name is ProviderName {
  return name in providerRegistry;
}
