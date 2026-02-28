import type { Conversation } from "../types/chat";

const CONVERSATIONS_KEY = "darkchat_conversations";
const API_KEY_KEY = "darkchat_openrouter_key";

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_KEY);
  } catch {
    return null;
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_KEY, key.trim());
  } catch {
    console.error("Failed to save API key");
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_KEY);
  } catch {
    // ignore
  }
}

export function getConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    console.error("Failed to save conversations");
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function truncateTitle(text: string, maxLen = 40): string {
  const cleaned = text.replace(/\n/g, " ").trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}…` : cleaned;
}
