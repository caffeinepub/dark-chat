import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Image, MessageSquare, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Conversation } from "../types/chat";
import { MessageBubble } from "./MessageBubble";

interface ChatAreaProps {
  conversation: Conversation | null;
  onRetry?: () => void;
}

const WELCOME_SUGGESTIONS = [
  {
    icon: Brain,
    text: "Explain quantum entanglement simply",
    color: "oklch(0.68 0.18 232)",
  },
  {
    icon: MessageSquare,
    text: "Write a compelling product pitch",
    color: "oklch(0.70 0.18 200)",
  },
  {
    icon: Zap,
    text: "What are React performance best practices?",
    color: "oklch(0.72 0.18 75)",
  },
  {
    icon: Image,
    text: "Analyze this image (upload with the 🖼 button)",
    color: "oklch(0.68 0.18 285)",
  },
];

export function ChatArea({ conversation, onRetry }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const currentLength = conversation?.messages.length ?? 0;
    if (currentLength !== prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      prevLengthRef.current = currentLength;
    }
  }, [conversation?.messages.length]);

  // Also scroll on streaming content changes
  useEffect(() => {
    const lastMsg = conversation?.messages[conversation.messages.length - 1];
    if (lastMsg?.isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [conversation?.messages]);

  if (!conversation || conversation.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 dot-grid-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center max-w-lg"
        >
          {/* Logo — panda emoji, centered */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
            className="w-20 h-20 mb-6 animate-pulse-ring flex items-center justify-center"
            style={{
              boxShadow:
                "0 0 0 2px oklch(0.45 0.18 245 / 0.35), 0 0 30px oklch(0.45 0.18 245 / 0.15)",
            }}
          >
            <span style={{ fontSize: "4rem", lineHeight: 1 }}>🐼</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl font-bold tracking-[0.12em] mb-2 gradient-title"
          >
            Panda AI
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="text-sm mb-1 leading-relaxed font-medium"
            style={{ color: "oklch(0.38 0.12 238)" }}
          >
            Powered by free AI models — automatically selected
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-xs mb-8 leading-relaxed"
            style={{ color: "oklch(0.45 0.07 242)" }}
          >
            Ask anything — text, code, images, and more. No model selection
            needed.
          </motion.p>

          {/* Suggestions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-2.5 w-full"
          >
            {WELCOME_SUGGESTIONS.map((suggestion, i) => {
              const Icon = suggestion.icon;
              return (
                <motion.div
                  key={suggestion.text}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42 + i * 0.07 }}
                  className="suggestion-card p-3.5 rounded-xl text-left cursor-default"
                >
                  <Icon
                    className="w-3.5 h-3.5 mb-2"
                    style={{ color: suggestion.color }}
                  />
                  <p
                    className="text-xs leading-snug"
                    style={{ color: "oklch(0.35 0.07 242)" }}
                  >
                    {suggestion.text}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0 dot-grid-bg">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {conversation.messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            index={i}
            onRetry={
              msg.role === "assistant" && msg.error ? onRetry : undefined
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

export function ActiveModelBadge({ modelId }: { modelId: string }) {
  if (!modelId) return null;

  const shortName = modelId.split("/").pop()?.replace(":free", "") ?? modelId;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        background: "oklch(0.92 0.03 248)",
        border: "1px solid oklch(0.80 0.06 252)",
      }}
    >
      {/* Live green dot */}
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
        style={{ background: "oklch(0.72 0.20 148)" }}
      />
      <span
        className="text-[10px] font-mono truncate max-w-28"
        style={{ color: "oklch(0.40 0.08 242)" }}
        title={modelId}
      >
        {shortName}
      </span>
      <span
        className="text-[9px] font-semibold px-1 py-0.5 rounded"
        style={{
          background: "oklch(0.88 0.10 155 / 0.40)",
          color: "oklch(0.35 0.18 148)",
          border: "1px solid oklch(0.70 0.12 155 / 0.50)",
        }}
      >
        Free
      </span>
    </motion.div>
  );
}
