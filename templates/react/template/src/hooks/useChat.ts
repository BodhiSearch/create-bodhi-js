import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useBodhi } from '@bodhiapp/bodhi-js-react';
import { getErrorMessage } from '@/lib/utils';
import { buildMcpToolsArray, decodeMcpToolName, type Mcp } from '@/lib/mcp-tools';
import type { ChatMessage, ToolCall } from '@/types/chat';

export function useChat(enabledMcpTools: Record<string, string[]>, mcps: Mcp[]) {
  const { client, isAuthenticated, isReady } = useBodhi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingModelsRef = useRef(false);

  const mcpSlugToId = useMemo(() => {
    const map = new Map<string, string>();
    mcps.forEach(m => map.set(m.slug, m.id));
    return map;
  }, [mcps]);

  const loadModels = useCallback(async () => {
    if (isLoadingModelsRef.current) return;
    isLoadingModelsRef.current = true;
    setIsLoadingModels(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        setError('Please log in to load models');
        return;
      }

      const modelIds: string[] = [];
      const response = client.models.list();
      if (!response || typeof response[Symbol.asyncIterator] !== 'function') {
        throw new Error('Invalid response from server');
      }

      for await (const model of response) {
        modelIds.push(model.id);
      }

      setModels(modelIds);
      if (modelIds.length > 0 && !selectedModel) {
        setSelectedModel(modelIds[0]);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError(getErrorMessage(err, 'Failed to fetch models'));
    } finally {
      setIsLoadingModels(false);
      isLoadingModelsRef.current = false;
    }
  }, [client, selectedModel, isAuthenticated]);

  useEffect(() => {
    if (isReady && isAuthenticated && models.length === 0 && !isLoadingModels) {
      loadModels();
    }
  }, [isReady, isAuthenticated, models.length, isLoadingModels, loadModels]);

  useEffect(() => {
    if (!isAuthenticated) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setMessages([]);
      setSelectedModel('');
      setModels([]);
      setError(null);
    }
  }, [isAuthenticated]);

  const executeToolCalls = useCallback(
    async (toolCalls: ToolCall[], signal: AbortSignal): Promise<ChatMessage[]> => {
      const results = await Promise.allSettled(
        toolCalls.map(async tc => {
          const decoded = decodeMcpToolName(tc.function.name);
          if (!decoded) {
            return {
              role: 'tool' as const,
              content: JSON.stringify({
                error: `Unknown tool format: ${tc.function.name}`,
              }),
              tool_call_id: tc.id,
            };
          }

          const mcpId = mcpSlugToId.get(decoded.mcpSlug);
          if (!mcpId) {
            return {
              role: 'tool' as const,
              content: JSON.stringify({
                error: `Unknown MCP: ${decoded.mcpSlug}`,
              }),
              tool_call_id: tc.id,
            };
          }

          if (signal.aborted) {
            return {
              role: 'tool' as const,
              content: JSON.stringify({ error: 'Aborted' }),
              tool_call_id: tc.id,
            };
          }

          try {
            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(tc.function.arguments);
            } catch {
              // Use empty args if parse fails
            }
            const result = await client.mcps.executeTool(mcpId, decoded.toolName, args);
            return {
              role: 'tool' as const,
              content: typeof result === 'string' ? result : JSON.stringify(result),
              tool_call_id: tc.id,
            };
          } catch (err) {
            return {
              role: 'tool' as const,
              content: JSON.stringify({
                error: err instanceof Error ? err.message : 'Tool execution failed',
              }),
              tool_call_id: tc.id,
            };
          }
        })
      );

      return results.map(r =>
        r.status === 'fulfilled'
          ? r.value
          : {
              role: 'tool' as const,
              content: JSON.stringify({ error: 'Tool execution failed' }),
              tool_call_id: '',
            }
      );
    },
    [client, mcpSlugToId]
  );

  const sendMessage = useCallback(
    async (prompt: string) => {
      if (!selectedModel) {
        setError('Please select a model first');
        return;
      }

      setError(null);
      setIsStreaming(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const conversationMessages: ChatMessage[] = [...messages, { role: 'user', content: prompt }];

      setMessages(prev => [...prev, { role: 'user', content: prompt }]);

      try {
        const tools = buildMcpToolsArray(enabledMcpTools, mcps);
        const currentMessages = [...conversationMessages];
        let continueLoop = true;

        while (continueLoop) {
          if (abortController.signal.aborted) break;

          // Add empty assistant message for streaming
          setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

          const requestParams: Record<string, unknown> = {
            model: selectedModel,
            messages: currentMessages,
            stream: true,
          };
          if (tools.length > 0) {
            requestParams.tools = tools;
          }

          const stream = client.chat.completions.create(
            requestParams as Parameters<typeof client.chat.completions.create>[0]
          );

          let assistantContent = '';
          const toolCalls: ToolCall[] = [];
          const toolCallBuffers: Record<number, { id: string; name: string; arguments: string }> =
            {};

          for await (const chunk of stream) {
            if (abortController.signal.aborted) break;

            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;

            // Handle content
            if (delta.content) {
              assistantContent += delta.content;
              setMessages(prev => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: assistantContent,
                };
                return updated;
              });
            }

            // Handle tool call deltas
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallBuffers[idx]) {
                  toolCallBuffers[idx] = {
                    id: tc.id ?? '',
                    name: tc.function?.name ?? '',
                    arguments: '',
                  };
                }
                if (tc.id) toolCallBuffers[idx].id = tc.id;
                if (tc.function?.name) toolCallBuffers[idx].name = tc.function.name;
                if (tc.function?.arguments) toolCallBuffers[idx].arguments += tc.function.arguments;
              }
            }

            // Check for finish reason
            const finishReason = chunk.choices?.[0]?.finish_reason;
            if (finishReason && finishReason !== 'tool_calls') {
              continueLoop = false;
            }
          }

          // Assemble tool calls from buffers
          for (const buf of Object.values(toolCallBuffers)) {
            if (buf.id && buf.name) {
              toolCalls.push({
                id: buf.id,
                type: 'function',
                function: { name: buf.name, arguments: buf.arguments },
              });
            }
          }

          if (toolCalls.length > 0) {
            // Update assistant message with tool_calls
            const assistantMsg: ChatMessage = {
              role: 'assistant',
              content: assistantContent,
              tool_calls: toolCalls,
            };
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = assistantMsg;
              return updated;
            });
            currentMessages.push(assistantMsg);

            // Execute tool calls
            const toolResults = await executeToolCalls(toolCalls, abortController.signal);

            // Add tool results to messages
            setMessages(prev => [...prev, ...toolResults]);
            currentMessages.push(...toolResults);

            // Continue loop for next model response
            continueLoop = true;
          } else {
            continueLoop = false;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Failed to send message:', err);
        setError(getErrorMessage(err, 'Failed to send message'));
        setMessages(prev => prev.slice(0, -1));
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [client, selectedModel, messages, enabledMcpTools, mcps, executeToolCalls]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    selectedModel,
    setSelectedModel,
    sendMessage,
    clearMessages,
    error,
    clearError,
    models,
    isLoadingModels,
    loadModels,
  };
}
