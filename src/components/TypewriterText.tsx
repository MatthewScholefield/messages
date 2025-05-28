import { useState, useEffect } from "react";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { useTypingStore } from "../store/typingStore"; // Added import

const FAST_TYPING_SPEED = 5; // Milliseconds for fast typing when off-screen
const FADE_IN_DURATION = 500; // Must match Tailwind's transition duration

interface TypewriterTextProps {
  fullText: string;
  typingSpeed?: number;
  className?: string;
}

interface TypingParagraphProps {
  text: string;
  originalTypingSpeed: number; // Renamed from typingSpeed
  paragraphIndex: number; // Added prop
}

const TypingParagraph: React.FC<TypingParagraphProps> = ({ text, originalTypingSpeed, paragraphIndex }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasFadedIn, setHasFadedIn] = useState(false); // New state for fade-in completion
  const [currentLocalTypingSpeed, setCurrentLocalTypingSpeed] = useState(originalTypingSpeed);
  const [hasLocallyCompletedTyping, setHasLocallyCompletedTyping] = useState(false);
  const [isWaitingAfterParagraph, setIsWaitingAfterParagraph] = useState(false); // New state

  const storeActiveParagraphIndex = useTypingStore(state => state.activeParagraphIndex);
  const storeIsTypingChainActive = useTypingStore(state => state.isTypingChainActive);
  const storeActions = useTypingStore(state => state.actions);

  const [paragraphRef, entry] = useIntersectionObserver({ threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
  const isIntersecting = entry?.isIntersecting ?? false;

  const isMyTurn = paragraphIndex === storeActiveParagraphIndex && storeIsTypingChainActive;

  // Effect to reset paragraph state if text or index changes (for component reuse)
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setHasFadedIn(false);
    setHasLocallyCompletedTyping(false);
    setCurrentLocalTypingSpeed(originalTypingSpeed);
  }, [text, paragraphIndex, originalTypingSpeed]);

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
      setHasLocallyCompletedTyping(true);
      storeActions.advanceToNextParagraph();
    }
  }, [isMyTurn, hasFadedIn, text, hasLocallyCompletedTyping, storeActions]);

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
        const delay = originalTypingSpeed * 20 * (text.length > 0 ? 1 : 0); // Only delay for non-empty
        setTimeout(() => {
          setHasLocallyCompletedTyping(true);
          setIsWaitingAfterParagraph(false);
          storeActions.advanceToNextParagraph();
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

    const timerId = setTimeout(() => {
      setDisplayedText(text.substring(0, currentIndex + 1));
      setCurrentIndex(prevIndex => prevIndex + 1);
    }, currentLocalTypingSpeed * delayMultiplier);

    return () => clearTimeout(timerId);
  }, [
    canStartLocalTypingAnimation,
    currentIndex,
    text,
    currentLocalTypingSpeed,
    hasLocallyCompletedTyping,
    storeActions,
    displayedText,
    isWaitingAfterParagraph, // Add to dependencies
    originalTypingSpeed // Add to dependencies
  ]);

  const showCursor = canStartLocalTypingAnimation && currentIndex < text.length && !hasLocallyCompletedTyping;

  return (
    <p
      ref={paragraphRef}
      className={`relative w-full whitespace-pre-wrap min-h-[1.5em] ${hasFadedIn ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 ease-in-out`}
    >
      <span className={`absolute top-0 left-0 w-full h-full whitespace-pre-wrap ${showCursor ? 'custom-cursor' : ''}`}>
        {displayedText}
        {/* {showCursor && <span className="inline-block w-0.5 h-[1em] bg-current animate-blink ml-px -mb-1 align-text-bottom"></span>} */}
      </span>
      {/* Hidden span for layout. Contains full text or a non-breaking space for empty lines. */}
      <span aria-hidden="true" className="opacity-0">
        {text.length > 0 ? text : '\u00A0'}
      </span>
    </p>
  );
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  fullText,
  typingSpeed = 70, // Default original speed
  className = "",
}) => {
  const { initializeTypingChain, resetTypingChain } = useTypingStore(state => state.actions);
  const paragraphs = fullText.split(/\n+/);
  const effectiveTypingSpeed = Math.max(10, typingSpeed);

  useEffect(() => {
    // Initialize store when fullText (and thus paragraphs) changes
    initializeTypingChain(paragraphs.length);
    // Cleanup function to reset store when component unmounts or fullText changes again
    return () => {
      resetTypingChain();
    };
  }, [fullText, initializeTypingChain, resetTypingChain, paragraphs.length]);


  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {paragraphs.map((paragraphText, index) => (
        <TypingParagraph
          key={`${index}-${paragraphText.slice(0,10)}`} // More robust key if paragraph content can change at same index
          text={paragraphText}
          originalTypingSpeed={effectiveTypingSpeed}
          paragraphIndex={index}
        />
      ))}
    </div>
  );
};
