import { create } from "zustand";
import { 
  persistConversation, 
  deletePersistedConversation, 
  updatePersistedConversation,
  persistMessage
} from "../lib/persistence";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: Attachment[];
  sources?: Source[];
  thinkingContent?: string;
  modelUsed?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  data?: string; // base64
  url?: string;
}

export interface Source {
  title: string;
  url?: string;
  snippet?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  thinkingEnabled: boolean;
  isPinned: boolean;
}

export interface ModelInfo {
  id: string;           // e.g., "anthropic/claude-sonnet-4-5"
  name: string;         // e.g., "Claude Sonnet 4.5"
  provider: string;     // e.g., "anthropic"
  isDefault?: boolean;
}

export interface Settings {
  gatewayUrl: string;
  gatewayToken: string;
  defaultModel: string;
  thinkingDefault: boolean;
  theme: "light" | "dark" | "system";
}

interface Store {
  // Connection
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // Available models from Gateway
  availableModels: ModelInfo[];
  modelsLoading: boolean;
  setAvailableModels: (models: ModelInfo[]) => void;
  setModelsLoading: (loading: boolean) => void;

  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  
  createConversation: () => Conversation;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  pinConversation: (id: string) => void;

  // Messages
  addMessage: (conversationId: string, message: Omit<Message, "id" | "timestamp">) => Message;
  appendToCurrentMessage: (content: string) => void;
  completeCurrentMessage: () => void;
  currentStreamingMessageId: string | null;

  // Settings
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
}

const generateId = () => crypto.randomUUID();

/**
 * Debounced persistence helper
 * Prevents excessive database writes during rapid updates (e.g., streaming)
 */
let persistTimer: number | undefined;
const debouncedPersist = (fn: () => void, delay = 500) => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = window.setTimeout(fn, delay);
};

export const useStore = create<Store>()((set, get) => ({
      // Connection
      connected: false,
      setConnected: (connected) => set({ connected }),

      // Available models
      availableModels: [],
      modelsLoading: false,
      setAvailableModels: (models) => set({ availableModels: models }),
      setModelsLoading: (loading) => set({ modelsLoading: loading }),

      // Conversations
      conversations: [],
      currentConversationId: null,
      currentStreamingMessageId: null,

      get currentConversation() {
        const state = get();
        return state.conversations.find((c) => c.id === state.currentConversationId) || null;
      },

      createConversation: () => {
        const conversation: Conversation = {
          id: generateId(),
          title: "New Chat",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          thinkingEnabled: get().settings.thinkingDefault,
          isPinned: false,
        };

        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: conversation.id,
        }));

        // Persist to IndexedDB (async, non-blocking)
        persistConversation(conversation).catch(err => {
          console.error('Failed to persist new conversation:', err);
        });

        return conversation;
      },

      selectConversation: (id) => {
        set({ currentConversationId: id });
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversationId:
            state.currentConversationId === id ? null : state.currentConversationId,
        }));

        // Delete from IndexedDB
        deletePersistedConversation(id).catch(err => {
          console.error('Failed to delete conversation from DB:', err);
        });
      },

      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        }));

        // Persist to IndexedDB
        const conversation = get().conversations.find(c => c.id === id);
        if (conversation) {
          updatePersistedConversation(conversation).catch(err => {
            console.error('Failed to update conversation in DB:', err);
          });
        }
      },

      pinConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, isPinned: !c.isPinned } : c
          ),
        }));

        // Persist to IndexedDB
        const conversation = get().conversations.find(c => c.id === id);
        if (conversation) {
          updatePersistedConversation(conversation).catch(err => {
            console.error('Failed to persist pin status:', err);
          });
        }
      },

      // Messages
      addMessage: (conversationId, messageData) => {
        const message: Message = {
          ...messageData,
          id: generateId(),
          timestamp: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: new Date(),
                  // Auto-generate title from first user message
                  title:
                    c.messages.length === 0 && messageData.role === "user"
                      ? messageData.content.slice(0, 40) + (messageData.content.length > 40 ? "..." : "")
                      : c.title,
                }
              : c
          ),
          currentStreamingMessageId: message.isStreaming ? message.id : null,
        }));

        // Persist message to IndexedDB (debounced for streaming)
        if (message.isStreaming) {
          debouncedPersist(() => {
            persistMessage(conversationId, message).catch(err => {
              console.error('Failed to persist streaming message:', err);
            });
          }, 1000);
        } else {
          persistMessage(conversationId, message).catch(err => {
            console.error('Failed to persist message:', err);
          });
        }

        return message;
      },

      appendToCurrentMessage: (content) => {
        const { currentConversationId, currentStreamingMessageId } = get();
        if (!currentConversationId || !currentStreamingMessageId) return;

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === currentConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === currentStreamingMessageId
                      ? { ...m, content: m.content + content }
                      : m
                  ),
                }
              : c
          ),
        }));

        // Debounced persistence for streaming (every 1s)
        const conversation = get().conversations.find(c => c.id === currentConversationId);
        const message = conversation?.messages.find(m => m.id === currentStreamingMessageId);
        if (message) {
          debouncedPersist(() => {
            persistMessage(currentConversationId, message).catch(err => {
              console.error('Failed to persist streaming update:', err);
            });
          }, 1000);
        }
      },

      completeCurrentMessage: () => {
        const { currentConversationId, currentStreamingMessageId } = get();
        if (!currentConversationId || !currentStreamingMessageId) return;

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === currentConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === currentStreamingMessageId
                      ? { ...m, isStreaming: false }
                      : m
                  ),
                }
              : c
          ),
          currentStreamingMessageId: null,
        }));

        // Final persistence after streaming completes
        const conversation = get().conversations.find(c => c.id === currentConversationId);
        const message = conversation?.messages.find(m => m.id === currentStreamingMessageId);
        if (message) {
          persistMessage(currentConversationId, { ...message, isStreaming: false }).catch(err => {
            console.error('Failed to persist completed message:', err);
          });
        }
      },

      // Settings
      settings: {
        gatewayUrl: "ws://localhost:18789",
        gatewayToken: "",
        defaultModel: "anthropic/claude-sonnet-4-5",
        thinkingDefault: false,
        theme: "system",
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
        
        // Persist settings to localStorage (settings are not encrypted)
        if (typeof window !== 'undefined') {
          const currentSettings = get().settings;
          localStorage.setItem('molt-settings', JSON.stringify({ ...currentSettings, ...updates }));
        }
      },
    }));
