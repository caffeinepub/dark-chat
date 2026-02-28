import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Image,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface ApiKeyModalProps {
  open: boolean;
  onSave: (key: string) => void;
  isEditing?: boolean;
  onClose?: () => void;
}

const FEATURE_LIST = [
  {
    icon: Sparkles,
    color: "oklch(0.65 0.18 232)",
    label: "Auto model selection",
    desc: "Best free model chosen automatically",
  },
  {
    icon: Zap,
    color: "oklch(0.72 0.18 75)",
    label: "Smart rate-limit rotation",
    desc: "Switches models on limit — seamlessly",
  },
  {
    icon: Image,
    color: "oklch(0.68 0.18 285)",
    label: "Vision & image support",
    desc: "Upload images and ask questions",
  },
];

export function ApiKeyModal({
  open,
  onSave,
  isEditing,
  onClose,
}: ApiKeyModalProps) {
  const [value, setValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter your OpenRouter API key.");
      return;
    }
    if (!trimmed.startsWith("sk-or-")) {
      setError("Key should start with sk-or-... Please check and try again.");
      return;
    }
    setError("");
    onSave(trimmed);
    setValue("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "oklch(0.70 0.03 248 / 0.55)",
            backdropFilter: "blur(16px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="w-full max-w-md"
          >
            {/* Card */}
            <div
              className="relative overflow-hidden rounded-2xl border"
              style={{
                background: "oklch(0.98 0.008 248)",
                borderColor: "oklch(0.78 0.08 250 / 0.60)",
                boxShadow:
                  "0 0 70px oklch(0.45 0.18 245 / 0.10), 0 28px 56px oklch(0.80 0.04 248 / 0.50)",
              }}
            >
              {/* Decorative gradient top line */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, oklch(0.45 0.20 238 / 0.70), transparent)",
                }}
              />
              {/* Ambient glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-28 rounded-full blur-3xl opacity-12 pointer-events-none"
                style={{ background: "oklch(0.70 0.14 245)" }}
              />

              <div className="relative p-7">
                {/* Logo + Title */}
                <div className="flex flex-col items-center mb-7">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 3.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 mb-4 flex items-center justify-center"
                    style={{
                      boxShadow:
                        "0 0 0 2px oklch(0.45 0.18 245 / 0.35), 0 0 24px oklch(0.45 0.18 245 / 0.15)",
                    }}
                  >
                    <span style={{ fontSize: "3rem", lineHeight: 1 }}>🐼</span>
                  </motion.div>
                  <h1 className="font-display text-2xl font-bold tracking-[0.12em] gradient-title">
                    Panda AI
                  </h1>
                  <p
                    className="text-sm mt-1.5 text-center leading-relaxed"
                    style={{ color: "oklch(0.42 0.08 242)" }}
                  >
                    {isEditing
                      ? "Update your OpenRouter API key"
                      : "Connect your OpenRouter API key to start chatting"}
                  </p>
                </div>

                {/* Feature checklist — only on first setup */}
                {!isEditing && (
                  <div
                    className="rounded-xl p-3 mb-5 space-y-2"
                    style={{
                      background: "oklch(0.94 0.02 248)",
                      border: "1px solid oklch(0.82 0.05 252)",
                    }}
                  >
                    {FEATURE_LIST.map((feature) => {
                      const Icon = feature.icon;
                      return (
                        <div
                          key={feature.label}
                          className="flex items-center gap-2.5"
                        >
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: `${feature.color.replace(")", " / 0.15)")}`,
                            }}
                          >
                            <Icon
                              className="w-3 h-3"
                              style={{ color: feature.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className="text-xs font-semibold"
                              style={{ color: "oklch(0.22 0.06 240)" }}
                            >
                              {feature.label}
                            </span>
                            <span
                              className="text-xs ml-1.5"
                              style={{ color: "oklch(0.45 0.06 244)" }}
                            >
                              — {feature.desc}
                            </span>
                          </div>
                          <Check
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: "oklch(0.65 0.18 155)" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* API Key Input */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="apikey"
                      className="text-sm font-medium text-foreground flex items-center gap-2"
                    >
                      <KeyRound
                        className="w-3.5 h-3.5"
                        style={{ color: "oklch(0.40 0.18 228)" }}
                      />
                      OpenRouter API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="apikey"
                        type={showKey ? "text" : "password"}
                        placeholder="sk-or-v1-..."
                        value={value}
                        onChange={(e) => {
                          setValue(e.target.value);
                          setError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        className="pr-10 font-mono text-sm bg-muted border-border focus:ring-1 focus:ring-primary"
                        autoComplete="off"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {error && (
                      <p
                        className="text-xs"
                        style={{ color: "oklch(0.65 0.22 25)" }}
                      >
                        {error}
                      </p>
                    )}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleSave}
                      className="w-full font-semibold text-sm btn-send"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.60 0.22 248), oklch(0.52 0.18 262))",
                        color: "oklch(0.98 0 0)",
                        border: "none",
                        boxShadow: "0 4px 20px oklch(0.60 0.22 248 / 0.32)",
                      }}
                    >
                      {isEditing
                        ? "Update Key & Continue"
                        : "Save & Start Chatting"}
                    </Button>
                  </motion.div>

                  {isEditing && onClose && (
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {/* Security note */}
                <div
                  className="mt-5 p-3 rounded-xl flex items-start gap-2.5"
                  style={{
                    background: "oklch(0.94 0.02 250)",
                    border: "1px solid oklch(0.82 0.04 252)",
                  }}
                >
                  <ShieldCheck
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "oklch(0.62 0.18 165)" }}
                  />
                  <div>
                    <p
                      className="text-xs font-semibold mb-0.5"
                      style={{ color: "oklch(0.28 0.10 240)" }}
                    >
                      Private &amp; Secure
                    </p>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "oklch(0.42 0.06 242)" }}
                    >
                      Your key is stored only in your browser's local storage —
                      never sent to any server.{" "}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 hover:underline"
                        style={{ color: "oklch(0.40 0.18 232)" }}
                      >
                        Get a free key
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
