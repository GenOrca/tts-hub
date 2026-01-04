#!/usr/bin/env node
import { Command } from 'commander';
import { config } from './config';
import { TTSService } from './services/tts.service';
import { ProviderName, AudioFormat } from './types';

const program = new Command();
const ttsService = new TTSService(config);

program
  .name('tts-hub')
  .description('Multi-provider Text-to-Speech CLI tool')
  .version('1.0.0');

program
  .command('speak')
  .description('Convert text to speech')
  .argument('<text>', 'Text to convert to speech')
  .option('-p, --provider <provider>', 'TTS provider (elevenlabs, varco)', config.defaultProvider)
  .option('-v, --voice <voiceId>', 'Voice ID to use')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Audio format (mp3, wav)', 'mp3')
  .option('--speed <speed>', 'Speech speed (0.5-2.0)', '1.0')
  .option('--pitch <pitch>', 'Speech pitch (-20 to 20)', '0')
  .option('--stability <stability>', 'Voice stability (0-1, ElevenLabs)', '0.5')
  .option('--similarity <similarity>', 'Similarity boost (0-1, ElevenLabs)', '0.75')
  .action(async (text: string, options) => {
    try {
      const provider = options.provider as ProviderName;

      if (!options.voice) {
        console.error('Error: Voice ID is required. Use "tts-hub voices" to list available voices.');
        process.exit(1);
      }

      console.log(`Synthesizing with ${provider}...`);

      const outputPath = await ttsService.synthesizeToFile(text, {
        provider,
        voiceId: options.voice,
        format: options.format as AudioFormat,
        speed: parseFloat(options.speed),
        pitch: parseFloat(options.pitch),
        stability: parseFloat(options.stability),
        similarityBoost: parseFloat(options.similarity),
        outputPath: options.output,
      });

      console.log(`Audio saved to: ${outputPath}`);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('voices')
  .description('List available voices')
  .option('-p, --provider <provider>', 'Filter by provider (elevenlabs, varco)')
  .action(async (options) => {
    try {
      const provider = options.provider as ProviderName | undefined;
      const voices = await ttsService.listVoices(provider);

      if (voices.length === 0) {
        console.log('No voices found. Make sure your API keys are configured.');
        return;
      }

      console.log('\nAvailable Voices:\n');
      console.log('─'.repeat(80));

      for (const voice of voices) {
        console.log(`ID:       ${voice.id}`);
        console.log(`Name:     ${voice.name}`);
        console.log(`Provider: ${voice.provider}`);
        if (voice.language) console.log(`Language: ${voice.language}`);
        if (voice.gender) console.log(`Gender:   ${voice.gender}`);
        if (voice.description) console.log(`Desc:     ${voice.description}`);
        console.log('─'.repeat(80));
      }

      console.log(`\nTotal: ${voices.length} voice(s)`);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('providers')
  .description('List configured providers')
  .action(() => {
    const configured = ttsService.getConfiguredProviders();
    const all = ttsService.getAllProviders();

    console.log('\nTTS Providers:\n');

    for (const provider of all) {
      const status = configured.includes(provider) ? '✓ Configured' : '✗ Not configured';
      const isDefault = provider === ttsService.getDefaultProvider() ? ' (default)' : '';
      console.log(`  ${provider}: ${status}${isDefault}`);
    }

    console.log('\nTo configure a provider, set the API key in your .env file.');
  });

program
  .command('test')
  .description('Test a provider connection')
  .option('-p, --provider <provider>', 'Provider to test', config.defaultProvider)
  .action(async (options) => {
    try {
      const provider = options.provider as ProviderName;
      console.log(`Testing ${provider} connection...`);

      const voices = await ttsService.listVoices(provider);
      console.log(`✓ Connection successful! Found ${voices.length} voices.`);
    } catch (error) {
      console.error(`✗ Connection failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
