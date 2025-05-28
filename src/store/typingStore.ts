import { create } from 'zustand';

interface TypingState {
  activeParagraphIndex: number;
  totalParagraphs: number;
  isTypingChainActive: boolean; // True if the overall typing process for the current message is active
  actions: {
    initializeTypingChain: (paragraphCount: number) => void;
    advanceToNextParagraph: () => void;
    resetTypingChain: () => void;
  };
}

const initialState = {
  activeParagraphIndex: 0,
  totalParagraphs: 0,
  isTypingChainActive: false,
};

export const useTypingStore = create<TypingState>((set) => ({
  ...initialState,
  actions: {
    initializeTypingChain: (paragraphCount) => {
      set({
        totalParagraphs: paragraphCount,
        activeParagraphIndex: 0,
        isTypingChainActive: paragraphCount > 0,
      });
    },
    advanceToNextParagraph: () => {
      set((state) => {
        if (!state.isTypingChainActive) return {}; // Should not proceed if chain is not active
        if (state.activeParagraphIndex < state.totalParagraphs - 1) {
          return { activeParagraphIndex: state.activeParagraphIndex + 1 };
        } else {
          // All paragraphs have been processed
          return { isTypingChainActive: false };
        }
      });
    },
    resetTypingChain: () => {
      set(initialState);
    },
  },
}));
