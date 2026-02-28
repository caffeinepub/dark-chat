import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "../types/chat";
import { renderMarkdown } from "../utils/markdown";

interface MessageBubbleProps {
  message: Message;
  index: number;
  onRetry?: () => void;
}

// Safe markdown renderer via DOM ref (avoids biome dangerouslySetInnerHTML lint)
function MarkdownContent({
  text,
  className,
}: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = renderMarkdown(text);
    }
  }, [text]);
  return <div ref={ref} className={className} />;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-0.5 px-1">
      <span
        className="typing-dot w-1.5 h-1.5 rounded-full"
        style={{ background: "oklch(0.68 0.18 228)" }}
      />
      <span
        className="typing-dot w-1.5 h-1.5 rounded-full"
        style={{ background: "oklch(0.68 0.18 228)" }}
      />
      <span
        className="typing-dot w-1.5 h-1.5 rounded-full"
        style={{ background: "oklch(0.68 0.18 228)" }}
      />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-accent"
      style={{ color: "oklch(0.48 0.06 242)" }}
      title="Copy message"
    >
      {copied ? (
        <Check
          className="w-3.5 h-3.5"
          style={{ color: "oklch(0.65 0.18 155)" }}
        />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTextContent(content: Message["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter((c) => c.type === "text")
    .map((c) => ("text" in c ? c.text : ""))
    .join("");
}

/** Detect if error is a rate-limit message */
function isRateLimitError(error: string): boolean {
  return (
    error.toLowerCase().includes("free-models-per-day") ||
    error.toLowerCase().includes("daily free model limit") ||
    error.toLowerCase().includes("rate limit") ||
    error.toLowerCase().includes("all free models")
  );
}

/** Detect if error is a data policy / free model publication error */
function isDataPolicyError(error: string): boolean {
  return (
    error.toLowerCase().includes("data policy") ||
    error.toLowerCase().includes("free model publication") ||
    error.toLowerCase().includes("no endpoints found") ||
    error.toLowerCase().includes("action required")
  );
}

/** Full error card for AI bubble errors */
function ErrorCard({
  error,
  extraContent,
  onRetry,
}: { error: string; extraContent?: string; onRetry?: () => void }) {
  const isRateLimit = isRateLimitError(error);
  const isDataPolicy = isDataPolicyError(error);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "oklch(0.14 0.06 22 / 0.55)",
        border: "1px solid oklch(0.42 0.18 25 / 0.40)",
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.20 0.08 22 / 0.70)" }}
        >
          <AlertCircle
            className="w-4 h-4"
            style={{ color: "oklch(0.68 0.20 25)" }}
          />
        </div>
        <div>
          <p
            className="text-sm font-semibold leading-tight"
            style={{ color: "oklch(0.78 0.14 28)" }}
          >
            {isDataPolicy
              ? "Privacy Setting Required"
              : isRateLimit
                ? "Daily Rate Limit Reached"
                : "Request Failed"}
          </p>
          {isDataPolicy ? (
            <div
              className="text-xs mt-1 leading-relaxed space-y-1"
              style={{ color: "oklch(0.72 0.08 242)" }}
            >
              <p>OpenRouter requires you to allow free model access.</p>
              <p
                className="font-medium"
                style={{ color: "oklch(0.82 0.12 55)" }}
              >
                Fix in 10 seconds:
              </p>
              <ol className="list-decimal ml-4 space-y-0.5">
                <li>
                  Open{" "}
                  <a
                    href="https://openrouter.ai/settings/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                    style={{ color: "oklch(0.68 0.18 228)" }}
                  >
                    openrouter.ai/settings/privacy
                  </a>
                </li>
                <li>
                  Enable <strong>"Allow free model access"</strong>
                </li>
                <li>Save, then resend your message</li>
              </ol>
            </div>
          ) : (
            <p
              className="text-xs mt-0.5 leading-relaxed"
              style={{ color: "oklch(0.62 0.08 242)" }}
            >
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Action button for data policy */}
      {isDataPolicy && (
        <a
          href="https://openrouter.ai/settings/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.60 0.22 55), oklch(0.52 0.20 40))",
            color: "oklch(0.98 0 0)",
            boxShadow: "0 2px 12px oklch(0.60 0.22 55 / 0.35)",
          }}
        >
          <ExternalLink className="w-3 h-3" />
          Fix: Open Privacy Settings
        </a>
      )}

      {/* Retry button — always show on errors */}
      <div className="flex flex-wrap gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.50 0.18 145), oklch(0.42 0.16 160))",
              color: "oklch(0.98 0 0)",
              boxShadow: "0 2px 12px oklch(0.50 0.18 145 / 0.35)",
            }}
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}

        {/* Action button for rate limit */}
        {isRateLimit && (
          <a
            href="https://openrouter.ai/credits"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.60 0.22 242), oklch(0.52 0.18 258))",
              color: "oklch(0.98 0 0)",
              boxShadow: "0 2px 12px oklch(0.60 0.22 242 / 0.35)",
            }}
          >
            <RefreshCw className="w-3 h-3" />
            Add credits
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Optional partial content */}
      {extraContent && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: "1px solid oklch(0.28 0.08 25 / 0.35)" }}
        >
          <MarkdownContent text={extraContent} className="prose-dark" />
        </div>
      )}
    </div>
  );
}

export function MessageBubble({ message, index, onRetry }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const textContent = getTextContent(message.content);
  const isEmpty = !textContent && !message.error && !message.imagePreview;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.15) }}
      className={`flex gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* AI Avatar — panda emoji */}
      {isAssistant && (
        <div className="shrink-0 mt-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-lg"
            style={{
              background: "oklch(0.93 0.03 240)",
              border: "1px solid oklch(0.62 0.22 245 / 0.32)",
            }}
          >
            🐼
          </div>
        </div>
      )}

      <div
        className={`flex flex-col max-w-[78%] ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Image preview (user uploads) */}
        {message.imagePreview && (
          <div
            className="mb-2 rounded-xl overflow-hidden border"
            style={{ borderColor: "oklch(0.28 0.08 250 / 0.45)" }}
          >
            <img
              src={message.imagePreview}
              alt="User uploaded"
              className="max-w-xs max-h-48 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Message bubble */}
        {(!isEmpty || message.isStreaming) && (
          <div
            className={`relative rounded-2xl px-4 py-3 ${
              isUser ? "user-bubble rounded-tr-sm" : "ai-bubble rounded-tl-sm"
            }`}
          >
            {isUser ? (
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {textContent}
              </p>
            ) : message.error ? (
              <ErrorCard
                error={message.error}
                extraContent={textContent || undefined}
                onRetry={onRetry}
              />
            ) : message.isStreaming && !textContent ? (
              <TypingDots />
            ) : (
              <MarkdownContent text={textContent} className="prose-dark" />
            )}

            {/* Cursor blink when streaming */}
            {message.isStreaming && textContent && (
              <span
                className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                style={{ background: "oklch(0.68 0.18 228)" }}
              />
            )}
          </div>
        )}

        {/* Timestamp + copy */}
        <div
          className={`flex items-center gap-1 mt-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <span
            className="text-[10px]"
            style={{ color: "oklch(0.38 0.04 242)" }}
          >
            {formatTime(message.timestamp)}
          </span>
          {isAssistant && !message.isStreaming && textContent && (
            <CopyButton text={textContent} />
          )}
        </div>
      </div>

      {/* User avatar — gradient circle with "U" initial */}
      {isUser && (
        <div
          className="shrink-0 mt-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.28 0.10 252), oklch(0.18 0.07 262))",
            color: "oklch(0.85 0.10 238)",
            border: "1px solid oklch(0.34 0.10 250 / 0.55)",
          }}
        >
          U
        </div>
      )}
    </motion.div>
  );
}
