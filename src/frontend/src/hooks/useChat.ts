import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, Message, MessageContent } from "../types/chat";
import { streamChatCompletion } from "../utils/openrouter";
import {
  generateId,
  getConversations,
  saveConversations,
  truncateTitle,
} from "../utils/storage";

interface UseChatOptions {
  apiKey: string;
  modelId: string;
  onModelRotated?: (newModelId: string) => void;
}

export function useChat({ apiKey, modelId, onModelRotated }: UseChatOptions) {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    getConversations(),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<boolean>(false);

  // Persist to localStorage whenever conversations change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;

  const startNewChat = useCallback(() => {
    setActiveId(null);
  }, []);

  const loadConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId],
  );

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveId(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string, imageDataUrl?: string): Promise<void> => {
      if (!text.trim() && !imageDataUrl) return;
      if (!apiKey || !modelId) return;

      abortRef.current = false;

      // Build user message content
      let userContent: string | MessageContent[];
      if (imageDataUrl) {
        userContent = [
          { type: "image_url", image_url: { url: imageDataUrl } },
          { type: "text", text: text.trim() || "What's in this image?" },
        ] as MessageContent[];
      } else {
        userContent = text.trim();
      }

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: userContent,
        timestamp: Date.now(),
        imagePreview: imageDataUrl,
      };

      // Determine if we create a new conversation or add to existing
      let conversationId = activeId;
      let isNewConversation = false;

      if (!conversationId) {
        conversationId = generateId();
        isNewConversation = true;
      }

      // Add user message
      const addUserMessage = (prev: Conversation[]): Conversation[] => {
        if (isNewConversation) {
          const newConv: Conversation = {
            id: conversationId!,
            title: truncateTitle(text || "Image"),
            messages: [userMsg],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          return [newConv, ...prev];
        }
        return prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...c.messages, userMsg],
                updatedAt: Date.now(),
              }
            : c,
        );
      };

      setConversations(addUserMessage);
      if (isNewConversation) setActiveId(conversationId);

      // Create placeholder AI message
      const aiMsgId = generateId();
      const aiMsg: Message = {
        id: aiMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, aiMsg], updatedAt: Date.now() }
            : c,
        ),
      );

      setIsStreaming(true);

      // Build messages array for API
      const getConvMessages = (convs: Conversation[]) =>
        convs.find((c) => c.id === conversationId)?.messages ?? [];

      // We need to capture the full conversation at this point
      // Use the state we just set — but we need to reconstruct from what we know
      const buildApiMessages = (allMessages: Message[]) => {
        // The messages up to (not including) the new AI placeholder
        const msgsToSend = allMessages.filter(
          (m) => m.id !== aiMsgId && !m.error,
        );
        return msgsToSend.map((m) => ({
          role: m.role,
          content: m.content,
        }));
      };

      try {
        let fullContent = "";

        // Get current messages from state
        setConversations((prev) => {
          const conv = prev.find((c) => c.id === conversationId);
          if (!conv) return prev;
          const apiMessages = buildApiMessages(conv.messages);

          // Fire off streaming (outside setState but using captured value)
          const doStream = async () => {
            try {
              const stream = streamChatCompletion(
                apiKey,
                modelId,
                apiMessages as Parameters<typeof streamChatCompletion>[2],
              );

              for await (const chunk of stream) {
                if (abortRef.current) break;

                // Handle model rotation (rate-limit on one model, auto-switched)
                if (chunk.rotatedToModel) {
                  onModelRotated?.(chunk.rotatedToModel);
                  continue;
                }

                if (chunk.error) {
                  setConversations((p) =>
                    p.map((c) =>
                      c.id === conversationId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === aiMsgId
                                ? {
                                    ...m,
                                    isStreaming: false,
                                    error: chunk.error,
                                    content: fullContent || " ",
                                  }
                                : m,
                            ),
                          }
                        : c,
                    ),
                  );
                  break;
                }

                if (chunk.content) {
                  fullContent += chunk.content;
                  const captured = fullContent;
                  setConversations((p) =>
                    p.map((c) =>
                      c.id === conversationId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === aiMsgId
                                ? { ...m, content: captured, isStreaming: true }
                                : m,
                            ),
                          }
                        : c,
                    ),
                  );
                }

                if (chunk.done) {
                  setConversations((p) =>
                    p.map((c) =>
                      c.id === conversationId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === aiMsgId
                                ? {
                                    ...m,
                                    isStreaming: false,
                                    content: fullContent || " ",
                                  }
                                : m,
                            ),
                          }
                        : c,
                    ),
                  );
                  break;
                }
              }
            } finally {
              setIsStreaming(false);
            }
          };

          doStream();
          return prev;
        });

        // Keep unused getConvMessages to satisfy linter — eslint ignore
        void getConvMessages;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error occurred";
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiMsgId
                      ? {
                          ...m,
                          isStreaming: false,
                          error: errorMsg,
                          content: " ",
                        }
                      : m,
                  ),
                }
              : c,
          ),
        );
        setIsStreaming(false);
      }
    },
    [activeId, apiKey, modelId, onModelRotated],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
    // Mark current streaming message as done
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.isStreaming ? { ...m, isStreaming: false } : m,
        ),
      })),
    );
  }, []);

  return {
    conversations,
    activeConversation,
    activeId,
    isStreaming,
    startNewChat,
    loadConversation,
    deleteConversation,
    clearAllConversations,
    sendMessage,
    stopStreaming,
  };
}
