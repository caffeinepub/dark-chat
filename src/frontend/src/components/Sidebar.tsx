import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Conversation } from "../types/chat";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function Sidebar({
  conversations,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
  onClearAll,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <motion.aside
      animate={{ width: collapsed ? 52 : 256 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="relative flex flex-col h-full shrink-0 sidebar-glass border-r"
      style={{
        borderColor: "oklch(0.82 0.04 252)",
        minWidth: collapsed ? 52 : 256,
      }}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-14 z-10 w-6 h-6 rounded-full border flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: "oklch(0.96 0.015 248)",
          borderColor: "oklch(0.75 0.08 250 / 0.6)",
          color: "oklch(0.40 0.18 245)",
        }}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-3 py-3 border-b shrink-0"
        style={{ borderColor: "oklch(0.85 0.04 252)" }}
      >
        <div
          className="w-8 h-8 shrink-0 flex items-center justify-center"
          style={{ boxShadow: "0 0 0 1px oklch(0.45 0.18 245 / 0.25)" }}
        >
          <span className="text-xl leading-none">🐼</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-display font-bold text-sm tracking-[0.18em] gradient-title overflow-hidden whitespace-nowrap"
            >
              Panda AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* New Chat Button */}
      <div className="px-2 py-2 shrink-0">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={onNewChat}
            className="w-full font-medium text-xs gap-2 justify-start"
            style={{
              background: collapsed
                ? "oklch(0.92 0.03 248)"
                : "linear-gradient(135deg, oklch(0.90 0.06 248), oklch(0.93 0.04 252))",
              border: "1px solid oklch(0.75 0.08 250 / 0.55)",
              color: "oklch(0.25 0.06 238)",
              padding: collapsed ? "8px" : undefined,
              justifyContent: collapsed ? "center" : undefined,
            }}
          >
            <Plus
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "oklch(0.40 0.18 232)" }}
            />
            {!collapsed && <span>New Chat</span>}
          </Button>
        </motion.div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 min-h-0 overflow-auto">
        <div className="px-2 pb-4">
          {conversations.length === 0 && !collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-10 text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.25, 0.5, 0.25],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <MessageSquarePlus
                  className="w-7 h-7"
                  style={{ color: "oklch(0.50 0.12 238)" }}
                />
              </motion.div>
              <p className="text-xs text-muted-foreground px-2 leading-relaxed">
                Your conversations
                <br />
                will appear here
              </p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.18 }}
                className="relative group mb-0.5"
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Active left accent indicator */}
                {activeId === conv.id && !collapsed && (
                  <motion.div
                    layoutId="active-indicator"
                    className="conv-active-indicator"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => onSelect(conv.id)}
                  className="w-full text-left rounded-lg px-2 py-2 flex items-start gap-2 transition-all"
                  style={{
                    background:
                      activeId === conv.id
                        ? "oklch(0.90 0.06 248)"
                        : hoveredId === conv.id
                          ? "oklch(0.93 0.03 248)"
                          : "transparent",
                    border:
                      activeId === conv.id
                        ? "1px solid oklch(0.72 0.10 250 / 0.55)"
                        : "1px solid transparent",
                    paddingLeft:
                      activeId === conv.id && !collapsed ? "10px" : undefined,
                  }}
                >
                  <Sparkles
                    className="w-3 h-3 mt-0.5 shrink-0"
                    style={{
                      color:
                        activeId === conv.id
                          ? "oklch(0.42 0.18 232)"
                          : "oklch(0.50 0.06 242)",
                    }}
                  />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium truncate leading-tight"
                        style={{
                          color:
                            activeId === conv.id
                              ? "oklch(0.20 0.06 238)"
                              : "oklch(0.35 0.05 242)",
                        }}
                      >
                        {conv.title}
                      </p>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: "oklch(0.55 0.05 244)" }}
                      >
                        {formatRelativeTime(conv.updatedAt)}
                      </p>
                    </div>
                  )}
                </button>

                {/* Delete button */}
                {!collapsed && hoveredId === conv.id && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:bg-destructive/20"
                    style={{ color: "oklch(0.55 0.15 25)" }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Clear All History */}
      {conversations.length > 0 && !collapsed && (
        <div
          className="px-2 py-2 shrink-0 border-t"
          style={{ borderColor: "oklch(0.85 0.04 252)" }}
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-red-50"
                style={{ color: "oklch(0.50 0.15 25)" }}
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Delete All History</span>
              </motion.button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all conversations?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {conversations.length}{" "}
                  conversation
                  {conversations.length !== 1 ? "s" : ""} from your history.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </motion.aside>
  );
}
