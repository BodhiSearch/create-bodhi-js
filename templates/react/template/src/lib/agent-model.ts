import type { Model } from '@mariozechner/pi-ai';
import type { ClientState } from '@bodhiapp/bodhi-js-react';
import { isDirectState } from '@bodhiapp/bodhi-js-react';
import type { ApiFormat } from '@bodhiapp/bodhi-js-react/api';

export type PiApi =
  | 'openai-completions'
  | 'openai-responses'
  | 'anthropic-messages'
  | 'google-generative-ai';

export function apiFormatToPiApi(fmt: ApiFormat, provider?: string | null): PiApi {
  switch (fmt) {
    case 'openai_responses':
      return 'openai-responses';
    case 'anthropic':
    case 'anthropic_oauth':
      return 'anthropic-messages';
    case 'gemini':
      return 'google-generative-ai';
    case 'llm_liberty_oauth':
      if (provider === 'anthropic') return 'anthropic-messages';
      if (provider === 'openai-codex') return 'openai-responses';
      if (provider === 'google-gemini') return 'google-generative-ai';
      return 'openai-completions';
    default:
      return 'openai-completions';
  }
}

export function apiFormatToProvider(fmt: ApiFormat, provider?: string | null): string {
  if (fmt === 'anthropic' || fmt === 'anthropic_oauth') return 'anthropic';
  if (fmt === 'gemini') return 'google';
  if (fmt === 'llm_liberty_oauth') {
    if (provider === 'anthropic') return 'anthropic';
    if (provider === 'openai-codex') return 'openai';
    if (provider === 'google-gemini') return 'google';
  }
  return 'openai';
}

export function getBaseUrl(serverUrl: string, fmt: ApiFormat, provider?: string | null): string {
  const trimmed = serverUrl.replace(/\/$/, '');
  if (fmt === 'anthropic' || fmt === 'anthropic_oauth') return `${trimmed}/anthropic`;
  if (fmt === 'gemini') return `${trimmed}/v1beta`;
  if (fmt === 'llm_liberty_oauth') {
    if (provider === 'anthropic') return `${trimmed}/anthropic`;
    if (provider === 'google-gemini') return `${trimmed}/v1beta`;
    return `${trimmed}/v1`;
  }
  return `${trimmed}/v1`;
}

export function buildModel(
  modelId: string,
  serverUrl: string,
  fmt: ApiFormat,
  provider?: string | null
): Model<PiApi> {
  return {
    id: modelId,
    name: modelId,
    api: apiFormatToPiApi(fmt, provider),
    provider: apiFormatToProvider(fmt, provider),
    baseUrl: getBaseUrl(serverUrl, fmt, provider),
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 4096,
  };
}

export function getServerUrlOrThrow(state: ClientState): string {
  if (!isDirectState(state) || !state.url) {
    throw new Error(
      'Chat requires a Bodhi server connection. Open Settings to connect to a server.'
    );
  }
  return state.url;
}
