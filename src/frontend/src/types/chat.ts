export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | MessageContent[];
  timestamp: number;
  imagePreview?: string; // base64 data url for display
  isStreaming?: boolean;
  error?: string;
}

export type MessageContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt: string;
    completion: string;
  };
}
