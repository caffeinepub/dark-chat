import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send, Square, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { fileToBase64 } from "../utils/openrouter";

interface ChatInputProps {
  onSend: (text: string, imageDataUrl?: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isStreaming,
  onStop,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (isStreaming) {
      onStop();
      return;
    }
    if (!text.trim() && !imagePreview) return;
    onSend(text, imagePreview ?? undefined);
    setText("");
    setImagePreview(null);
  }, [text, imagePreview, isStreaming, onSend, onStop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageFile = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
      toast.error("Only JPG, PNG, GIF, and WebP images are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB.");
      return;
    }
    try {
      const dataUrl = await fileToBase64(file);
      setImagePreview(dataUrl);
    } catch {
      toast.error("Failed to load image.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleImageFile(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      await handleImageFile(file);
    }
  };

  const canSend =
    (text.trim().length > 0 || imagePreview !== null) && !disabled;

  return (
    <div
      className="relative px-3 pb-3 pt-1"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 rounded-2xl flex items-center justify-center"
            style={{
              background: "oklch(0.12 0.06 256 / 0.96)",
              border: "2px dashed oklch(0.62 0.22 245 / 0.65)",
              backdropFilter: "blur(4px)",
              margin: "4px",
            }}
          >
            <div className="text-center">
              <ImagePlus
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: "oklch(0.65 0.18 232)" }}
              />
              <p className="text-sm font-medium text-foreground">
                Drop image here
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="rounded-2xl border p-2 transition-all"
        style={{
          background: "oklch(1.0 0 0)",
          borderColor: isDragging
            ? "oklch(0.62 0.22 245 / 0.65)"
            : "oklch(0.80 0.05 240)",
          boxShadow: isDragging
            ? "0 0 20px oklch(0.62 0.22 245 / 0.18)"
            : "0 -2px 24px oklch(0.70 0.06 240 / 0.30)",
        }}
      >
        {/* Image preview badge */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 px-1"
            >
              <div className="relative inline-flex items-center gap-2">
                {/* Thumbnail */}
                <div
                  className="relative rounded-xl overflow-hidden"
                  style={{ border: "1px solid oklch(0.30 0.08 250 / 0.45)" }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-auto object-cover rounded-xl"
                  />
                  {/* Remove overlay button */}
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
                    style={{
                      background: "oklch(0.15 0.05 256 / 0.90)",
                      color: "oklch(0.78 0.08 242)",
                      border: "1px solid oklch(0.35 0.08 250 / 0.50)",
                    }}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    background: "oklch(0.16 0.058 252)",
                    border: "1px solid oklch(0.28 0.08 250 / 0.40)",
                    color: "oklch(0.65 0.12 240)",
                  }}
                >
                  Image attached
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text + buttons row */}
        <div className="flex items-end gap-2">
          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="shrink-0 mb-1 p-2 rounded-xl transition-all hover:scale-105 disabled:opacity-40"
            style={{
              background: imagePreview
                ? "oklch(0.92 0.04 240)"
                : "oklch(0.94 0.02 240)",
              color: imagePreview
                ? "oklch(0.40 0.18 232)"
                : "oklch(0.40 0.07 244)",
              border: `1px solid ${imagePreview ? "oklch(0.75 0.12 250 / 0.55)" : "oklch(0.80 0.05 240)"}`,
            }}
            title="Upload image (JPG, PNG, GIF, WebP)"
          >
            <ImagePlus className="w-4 h-4" />
          </button>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything — text, code, or upload an image…"
            disabled={disabled}
            className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm min-h-[40px] max-h-32 py-2 px-2 chat-input-textarea"
            style={{
              color: "oklch(0.15 0.02 256)",
              caretColor: "oklch(0.45 0.18 245)",
              scrollbarWidth: "none",
            }}
            rows={1}
          />

          {/* Send / Stop button — gradient */}
          <motion.button
            type="button"
            onClick={handleSend}
            disabled={!isStreaming && !canSend}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.91 }}
            className="shrink-0 mb-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 btn-send"
            style={{
              background: isStreaming
                ? "oklch(0.62 0.22 25)"
                : canSend
                  ? "linear-gradient(135deg, oklch(0.58 0.24 242), oklch(0.50 0.20 260))"
                  : "oklch(0.88 0.03 240)",
              color: "oklch(0.98 0 0)",
              border: "none",
              boxShadow: isStreaming
                ? "0 0 14px oklch(0.62 0.22 25 / 0.45)"
                : canSend
                  ? "0 0 18px oklch(0.58 0.24 242 / 0.45)"
                  : "none",
            }}
          >
            {isStreaming ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </motion.button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Hint text */}
      <p
        className="text-center text-[10px] mt-1.5"
        style={{ color: "oklch(0.45 0.06 246)" }}
      >
        Enter to send · Shift+Enter for new line · Free AI — no credits needed
      </p>
    </div>
  );
}
