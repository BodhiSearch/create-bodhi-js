import { unwrapResponse, type UIClient } from '@bodhiapp/bodhi-js-react';
import type {
  AliasResponse,
  ApiFormat,
  ApiModel,
  PaginatedAliasResponse,
} from '@bodhiapp/bodhi-js-react/api';

export interface BodhiModelInfo {
  id: string;
  apiFormat: ApiFormat;
  llmLibertyProvider?: string | null;
}

function modelId(m: ApiModel): string | undefined {
  if (m.provider === 'gemini') {
    return m.name?.startsWith('models/') ? m.name.slice('models/'.length) : m.name;
  }
  return m.id;
}

function flattenAlias(entry: AliasResponse): BodhiModelInfo[] {
  if ('models' in entry) {
    const prefix = entry.prefix ?? '';
    const fmt = entry.api_format ?? 'openai';
    const llmLibertyProvider =
      'llm_liberty' in entry ? (entry.llm_liberty?.provider ?? null) : null;
    return (entry.models ?? [])
      .map((m): BodhiModelInfo | null => {
        const id = modelId(m);
        return id ? { id: `${prefix}${id}`, apiFormat: fmt, llmLibertyProvider } : null;
      })
      .filter((x): x is BodhiModelInfo => x !== null);
  }
  if ('alias' in entry && entry.alias) {
    return [{ id: entry.alias, apiFormat: 'openai' }];
  }
  return [];
}

export async function fetchBodhiModels(client: UIClient): Promise<BodhiModelInfo[]> {
  const res = await client.sendApiRequest<void, PaginatedAliasResponse>(
    'GET',
    '/bodhi/v1/models?page_size=100'
  );
  const body = unwrapResponse(res);
  return (body.data ?? []).flatMap(flattenAlias);
}
