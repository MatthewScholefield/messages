import { useState, useEffect } from "react";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { useTypingStore } from "../store/typingStore";

const FAST_TYPING_SPEED = 5; // Milliseconds for fast typing when off-screen
const FADE_IN_DURATION = 500; // Must match Tailwind's transition duration

interface TypewriterTextProps {
  messageId: string; // Added prop for message identification
  fullText: string;
  typingSpeed?: number;
  className?: string;
}

interface TypingParagraphProps {
  messageId: string; // Added prop for message identification
  text: string;
  originalTypingSpeed: number; // Renamed from typingSpeed
  paragraphIndex: number; // Added prop
}

const TypingParagraph: React.FC<TypingParagraphProps> = ({ messageId, text, originalTypingSpeed, paragraphIndex }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasFadedIn, setHasFadedIn] = useState(false);
  const [currentLocalTypingSpeed, setCurrentLocalTypingSpeed] = useState(originalTypingSpeed);
  const [isWaitingAfterParagraph, setIsWaitingAfterParagraph] = useState(false);

  const chainState = useTypingStore(state => state.actions.getTypingChainState(messageId));
  const storeActions = useTypingStore(state => state.actions);
  
  // Get the chain state for this specific message
  const storeActiveParagraphIndex = chainState.activeParagraphIndex;
  const storeIsTypingChainActive = chainState.isTypingChainActive;

  const [paragraphRef, entry] = useIntersectionObserver({ threshold: 0.1 });
  const isIntersecting = entry?.isIntersecting ?? false;

  const hasLocallyCompletedTyping = storeActiveParagraphIndex > paragraphIndex;
  const isMyTurn = paragraphIndex === storeActiveParagraphIndex && storeIsTypingChainActive;

  // Effect to reset paragraph state if text or index changes (for component reuse)
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setHasFadedIn(false);
    setCurrentLocalTypingSpeed(originalTypingSpeed);
  }, [messageId, paragraphIndex, originalTypingSpeed]);

  // Effect for fade-in logic
  useEffect(() => {
    if (isIntersecting && !hasFadedIn) {
      const timer = setTimeout(() => {
        setHasFadedIn(true);
      }, FADE_IN_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isIntersecting, hasFadedIn]);

  // Effect for adjusting typing speed based on visibility if it's this paragraph's turn
  useEffect(() => {
    let newSpeed = originalTypingSpeed;
    if (isMyTurn) {
      if (!isIntersecting) {
        newSpeed = FAST_TYPING_SPEED; // Speed up if off-screen during its turn
      }
    }
    // If not my turn, speed remains originalTypingSpeed (or as set by reset effect)
    if (currentLocalTypingSpeed !== newSpeed) {
      setCurrentLocalTypingSpeed(newSpeed);
    }
  }, [isMyTurn, isIntersecting, originalTypingSpeed, currentLocalTypingSpeed]);


  const canStartLocalTypingAnimation = isMyTurn && isIntersecting && text.length > 0;

  // Effect to handle empty text paragraphs
  useEffect(() => {
    if (isMyTurn && hasFadedIn && text.length === 0 && !hasLocallyCompletedTyping) {
      storeActions.advanceToNextParagraph(messageId);
    }
  }, [isMyTurn, hasFadedIn, text, hasLocallyCompletedTyping, storeActions, messageId]);

  // Typing effect for non-empty paragraphs
  useEffect(() => {
    if (!canStartLocalTypingAnimation || hasLocallyCompletedTyping) {
      // If typing completed and text somehow differs, ensure it's set.
      if (hasLocallyCompletedTyping && displayedText !== text && text.length > 0) {
        setDisplayedText(text);
      }
      return;
    }

    if (currentIndex >= text.length) {
      // This block handles completion of typing for this paragraph
      setDisplayedText(text); // Ensure full text is shown
      // Add post-paragraph delay before advancing
      if (!isWaitingAfterParagraph) {
        setIsWaitingAfterParagraph(true);
        const delay = originalTypingSpeed * 10 * (text.length > 0 ? 1 : 0); // Only delay for non-empty
        setTimeout(() => {
          setIsWaitingAfterParagraph(false);
          storeActions.advanceToNextParagraph(messageId);
        }, delay);
      }
      return;
    }

    // Determine delay multiplier based on current character
    const currentChar = text[currentIndex];
    let delayMultiplier = 1;
    if (currentChar === ',' || currentChar === '，') {
      delayMultiplier = 1.5;
    } else if (
      currentChar === '.' || currentChar === '。' ||
      currentChar === '!' || currentChar === '！' ||
      currentChar === '?' || currentChar === '？'
    ) {
      delayMultiplier = 2;
    }

    // Make non-Chinese characters type 3.4x faster
    // Chinese unicode range: \u4e00-\u9fff
    const isChinese = /[\u4e00-\u9fff]/.test(currentChar);
    const speedFactor = isChinese ? 1 : (0.297); // ≈ 0.294
    const baseDelay = currentLocalTypingSpeed * delayMultiplier * speedFactor;

    // Add randomness: Gaussian noise, mean=baseDelay, stddev=baseDelay*0.18
    const stddev = baseDelay * 0.18;
    let randomDelay = baseDelay + gaussianRandom() * stddev;
    // Clamp to [baseDelay * 0.5, baseDelay * 2] to avoid extremes
    randomDelay = Math.max(baseDelay * 0.5, Math.min(randomDelay, baseDelay * 2));

    const timerId = setTimeout(() => {
      setDisplayedText(text.substring(0, currentIndex + 1));
      setCurrentIndex(prevIndex => prevIndex + 1);
    }, randomDelay);

    return () => clearTimeout(timerId);
  }, [
    canStartLocalTypingAnimation,
    currentIndex,
    text,
    currentLocalTypingSpeed,
    hasLocallyCompletedTyping,
    storeActions,
    displayedText,
    isWaitingAfterParagraph,
    originalTypingSpeed,
    messageId // Add messageId to dependencies
  ]);

  const showCursor = canStartLocalTypingAnimation && currentIndex < text.length && !hasLocallyCompletedTyping;

  return (
    <p
      ref={paragraphRef}
      className={`relative w-full whitespace-pre-wrap min-h-[1.5em] ${hasFadedIn ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 ease-in-out`}
    >
      <span className={`z-10 select-text absolute top-0 left-0 w-full h-full whitespace-pre-wrap ${showCursor ? 'custom-cursor' : ''}`}>
        {displayedText}
        {/* {showCursor && <span className="inline-block w-0.5 h-[1em] bg-current animate-blink ml-px -mb-1 align-text-bottom"></span>} */}
      </span>
      {/* Hidden span for layout. Contains full text or a non-breaking space for empty lines. */}
      <span aria-hidden="true" className="opacity-0 select-none -z-10">
        {text.length > 0 ? text : '\u00A0'}
      </span>
    </p>
  );
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  fullText,
  messageId,
  typingSpeed = 70,
  className = "",
}) => {
  const { initializeTypingChain, resetTypingChain } = useTypingStore(state => state.actions);
  const paragraphs = fullText.split(/\n+/);
  const effectiveTypingSpeed = Math.max(10, typingSpeed);

  useEffect(() => {
    // Initialize store with messageId when fullText changes
    initializeTypingChain(messageId, paragraphs.length);
  }, [fullText, initializeTypingChain, resetTypingChain, paragraphs.length, messageId]);


  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {paragraphs.map((paragraphText, index) => (
        <TypingParagraph
          messageId={messageId} // Pass messageId to each paragraph
          key={`${index}-${paragraphText.slice(0,10)}`} // More robust key if paragraph content can change at same index
          text={paragraphText}
          originalTypingSpeed={effectiveTypingSpeed}
          paragraphIndex={index}
        />
      ))}
    </div>
  );
};

// Utility: Gaussian random number generator (mean=0, stddev=1)
function gaussianRandom() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Avoid 0
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
