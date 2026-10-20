export type PersonaType = 'general' | 'coder' | 'writer' | 'tutor' | 'urdu_friendly';

export interface PersonaConfig {
  id: PersonaType;
  name: string;
  badge: string;
  description: string;
  icon: string;
  defaultPrompt: string;
}

export interface AttachedImage {
  mimeType: string;
  data: string; // base64 data URL
  name?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  images?: AttachedImage[];
  isStreaming?: boolean;
  isImageGenerated?: boolean;
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  persona: PersonaType;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  enableSearch: boolean;
}
