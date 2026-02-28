import { Toaster } from "@/components/ui/sonner";
import { Loader2, Menu, Settings, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ApiKeyModal } from "./components/ApiKeyModal";
import { ActiveModelBadge, ChatArea } from "./components/ChatArea";
import { ChatInput } from "./components/ChatInput";
import { Sidebar } from "./components/Sidebar";
import { useChat } from "./hooks/useChat";
import { fetchBestModel } from "./utils/openrouter";
import { getApiKey, saveApiKey } from "./utils/storage";

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => getApiKey() ?? "");
  const [showApiModal, setShowApiModal] = useState<boolean>(() => !getApiKey());
  const [modelId, setModelId] = useState<string>("");
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleModelRotated = useCallback((newModelId: string) => {
    setModelId(newModelId);
  }, []);

  const {
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
  } = useChat({ apiKey, modelId, onModelRotated: handleModelRotated });

  // Load best model when API key is set
  const loadModel = useCallback(async (key: string) => {
    if (!key) return;
    setIsLoadingModel(true);
    try {
      const best = await fetchBestModel(key);
      setModelId(best);
    } catch {
      setModelId("google/gemini-2.0-flash-exp:free");
      toast.error("Could not fetch model list. Using fastest default model.");
    } finally {
      setIsLoadingModel(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      loadModel(apiKey);
    }
  }, [apiKey, loadModel]);

  const handleSaveApiKey = (key: string) => {
    saveApiKey(key);
    setApiKey(key);
    setShowApiModal(false);
    toast.success("API key saved. Connecting to OpenRouter...");
  };

  const handleSend = async (text: string, imageDataUrl?: string) => {
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }
    if (!modelId) {
      toast.error("Model is still loading. Please wait a moment.");
      return;
    }
    await sendMessage(text, imageDataUrl);
  };

  // Retry: find last user message in the active conversation and resend it
  const handleRetry = () => {
    if (!activeConversation) return;
    const msgs = activeConversation.messages;
    // Find the last user message before the failed AI response
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user") {
        const userMsg = msgs[i];
        const textContent =
          typeof userMsg.content === "string"
            ? userMsg.content
            : userMsg.content
                .filter((c) => c.type === "text")
                .map((c) => ("text" in c ? c.text : ""))
                .join("");
        // Remove the failed AI message before retrying
        sendMessage(textContent, userMsg.imagePreview);
        return;
      }
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col noise-bg mesh-bg">
      {/* API Key Modal */}
      <ApiKeyModal
        open={showApiModal}
        onSave={handleSaveApiKey}
        isEditing={!!apiKey}
        onClose={apiKey ? () => setShowApiModal(false) : undefined}
      />

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="overflow-hidden"
            >
              <div className="h-full">
                <Sidebar
                  conversations={conversations}
                  activeId={activeId}
                  onNewChat={startNewChat}
                  onSelect={loadConversation}
                  onDelete={deleteConversation}
                  onClearAll={clearAllConversations}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Sticky frosted-glass header */}
          <header className="header-glass shrink-0 flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              {/* Sidebar toggle */}
              <motion.button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                className="p-1.5 rounded-lg transition-all hover:bg-accent"
                style={{ color: "oklch(0.40 0.10 242)" }}
              >
                {sidebarOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </motion.button>

              <div className="flex items-center gap-2.5">
                {/* Logo — square-rounded with blue glow */}
                <motion.div
                  className="w-8 h-8 animate-pulse-ring flex items-center justify-center"
                  style={{
                    boxShadow:
                      "0 0 0 1px oklch(0.45 0.18 245 / 0.30), 0 0 14px oklch(0.45 0.18 245 / 0.15)",
                  }}
                  animate={{ y: [0, -2, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <span className="text-xl leading-none">🐼</span>
                </motion.div>

                <h1 className="font-display font-bold tracking-[0.18em] text-sm gradient-title">
                  Panda AI
                </h1>
              </div>

              {/* Model indicator */}
              <div className="hidden sm:flex items-center gap-2">
                {isLoadingModel ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shimmer"
                    style={{
                      background: "oklch(0.93 0.02 248)",
                      border: "1px solid oklch(0.82 0.04 252)",
                    }}
                  >
                    <Loader2
                      className="w-3 h-3 animate-spin"
                      style={{ color: "oklch(0.45 0.18 228)" }}
                    />
                    <span
                      className="text-[10px]"
                      style={{ color: "oklch(0.40 0.08 242)" }}
                    >
                      Selecting model…
                    </span>
                  </div>
                ) : (
                  <ActiveModelBadge modelId={modelId} />
                )}
              </div>
            </div>

            {/* Settings */}
            <motion.button
              type="button"
              onClick={() => setShowApiModal(true)}
              whileHover={{ scale: 1.1, rotate: 30 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl transition-all hover:bg-accent"
              style={{ color: "oklch(0.40 0.08 242)" }}
              title="API Key Settings"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          </header>

          {/* Chat area */}
          <div className="flex-1 min-h-0 flex flex-col">
            <ChatArea conversation={activeConversation} onRetry={handleRetry} />

            {/* Input */}
            <div className="shrink-0">
              <ChatInput
                onSend={handleSend}
                isStreaming={isStreaming}
                onStop={stopStreaming}
                disabled={!apiKey || (isLoadingModel && !modelId)}
              />
            </div>
          </div>
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(0.97 0.01 245)",
            border: "1px solid oklch(0.82 0.04 252)",
            color: "oklch(0.20 0.05 242)",
          },
        }}
      />

      {/* Footer */}
      <footer
        className="shrink-0 py-1.5 text-center"
        style={{ borderTop: "1px solid oklch(0.82 0.04 252 / 0.70)" }}
      >
        <p className="text-[10px]" style={{ color: "oklch(0.50 0.05 246)" }}>
          Panda AI may make mistakes. Verify important info. &nbsp;·&nbsp; ©{" "}
          {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "oklch(0.40 0.16 232)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
