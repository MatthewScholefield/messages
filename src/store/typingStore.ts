import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TypingChainState {
  activeParagraphIndex: number;
  totalParagraphs: number;
  isTypingChainActive: boolean;
}

interface TypingState {
  typingChains: Record<string, TypingChainState>;
  actions: {
    initializeTypingChain: (messageId: string, paragraphCount: number) => void;
    advanceToNextParagraph: (messageId: string) => void;
    resetTypingChain: (messageId: string) => void;
    getTypingChainState: (messageId: string) => TypingChainState;
  };
}

const defaultChainState: TypingChainState = {
  activeParagraphIndex: 0,
  totalParagraphs: 0,
  isTypingChainActive: false,
};

const initialState = {
  typingChains: {},
};

export const useTypingStore = create<TypingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      actions: {
        initializeTypingChain: (messageId, paragraphCount) => {
          set((state) => ({
            typingChains: {
            ...state.typingChains,
              [messageId]: {
                totalParagraphs: paragraphCount,
                activeParagraphIndex: (state.typingChains[messageId] || {})?.activeParagraphIndex || 0,
                isTypingChainActive: paragraphCount > 0,
              },
            },
          }));
        },
        advanceToNextParagraph: (messageId) => {
          set((state) => {
            const chain = state.typingChains[messageId] || defaultChainState;
            return {
              typingChains: {
                ...state.typingChains,
                [messageId]: {
                  ...chain,
                  activeParagraphIndex: chain.activeParagraphIndex + 1,
                },
              },
            };
          });
        },
        resetTypingChain: (messageId) => {
          set((state) => {
            const newChains = { ...state.typingChains };
            delete newChains[messageId];
            return { typingChains: newChains };
          });
        },
        getTypingChainState: (messageId) => {
          return get().typingChains[messageId] || defaultChainState;
        },
      },
    }),
    {
      name: 'typing-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        typingChains: state.typingChains,
      }),
    }
  )
);
