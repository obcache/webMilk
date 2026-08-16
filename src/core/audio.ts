import type { AudioChannelLayout, WebMilkAudioBuffer } from './types';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getAudioChunk = (
  audio: WebMilkAudioBuffer | undefined,
  startTimeSec: number,
  endTimeSec: number,
): { chunk?: Float32Array; channelLayout?: AudioChannelLayout } => {
  if (!audio || audio.channels.length === 0 || audio.sampleRate <= 0) return {};

  const channelCount = Math.min(audio.channels.length, 2);
  const layout: AudioChannelLayout = channelCount === 1 ? 'mono' : 'stereo';
  const startSample = clamp(Math.floor(Math.max(0, startTimeSec) * audio.sampleRate), 0, Number.MAX_SAFE_INTEGER);
  const endSample = clamp(Math.ceil(Math.max(startTimeSec, endTimeSec) * audio.sampleRate), startSample, Number.MAX_SAFE_INTEGER);
  const sampleCount = Math.max(0, endSample - startSample);
  if (sampleCount === 0) return { chunk: new Float32Array(0), channelLayout: layout };

  const output = new Float32Array(sampleCount * channelCount);
  for (let sample = 0; sample < sampleCount; sample += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      output[(sample * channelCount) + channel] = audio.channels[channel]?.[startSample + sample] ?? 0;
    }
  }

  return { chunk: output, channelLayout: layout };
};

export const createSineWaveAudio = ({
  durationSec,
  sampleRate = 48_000,
  frequency = 440,
}: {
  durationSec: number;
  sampleRate?: number;
  frequency?: number;
}): WebMilkAudioBuffer => {
  const sampleCount = Math.max(0, Math.ceil(durationSec * sampleRate));
  const left = new Float32Array(sampleCount);
  const right = new Float32Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = Math.sin((index / sampleRate) * frequency * Math.PI * 2) * 0.25;
    left[index] = sample;
    right[index] = sample;
  }
  return { sampleRate, channels: [left, right] };
};
