import { useCallback, useEffect, useRef, useState } from "react";
import { useMeasure } from "@uidotdev/usehooks";

const AUTOSIZE_MAX_HEIGHT = 500;

interface AutoResizedTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number;
  autoExpand?: boolean;
}

export const AutoResizedTextArea: React.FC<AutoResizedTextAreaProps> = ({
  maxHeight,
  autoExpand,
  autoFocus,
  ...props
}) => {
  const [hiddenTextArea, setHiddenTextArea] = useState<HTMLTextAreaElement | null>(null);
  const [textArea, setTextArea] = useState<HTMLTextAreaElement | null>(null);
  const hiddenTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [maxMaxHeight, setMaxMaxHeight] = useState(maxHeight || AUTOSIZE_MAX_HEIGHT);

  const [measureRef, { width: textAreaWidth }] = useMeasure<HTMLTextAreaElement>();

  hiddenTextAreaRef.current = hiddenTextArea;

  useEffect(() => {
    if (autoFocus && textArea) {
      textArea.focus();
    }
  }, [autoFocus, textArea]);

  useEffect(() => {
    if (!textArea) return;
    const resizeObserver = new ResizeObserver(() => {
      const hiddenTextArea = hiddenTextAreaRef.current;
      if (textArea && hiddenTextArea && textAreaWidth && !autoExpand) {
        const newMaxMaxHeight =
          textArea.offsetHeight === hiddenTextArea.scrollHeight
            ? maxHeight || AUTOSIZE_MAX_HEIGHT
            : textArea.offsetHeight;
        setMaxMaxHeight(newMaxMaxHeight);
      }
    });

    resizeObserver.observe(textArea);

    return () => {
      resizeObserver.unobserve(textArea);
    };
  }, [textArea, maxHeight, textAreaWidth, autoExpand]);

  useEffect(() => {
    if (textArea && hiddenTextArea && textAreaWidth) {
      hiddenTextArea.style.width = `${textAreaWidth}px`;
      hiddenTextArea.value = props.value as string;
      const totalTextHeight = hiddenTextArea.scrollHeight + 2;

      textArea.style.height = `${Math.min(totalTextHeight, maxMaxHeight)}px`;
      textArea.style.maxHeight = `${totalTextHeight}px`;
    }
  }, [props.value, maxMaxHeight, textArea, hiddenTextArea, textAreaWidth]);

  const textAreaRef = useCallback((node: HTMLTextAreaElement | null) => {
          setTextArea(node);
          measureRef(node);
        }, [measureRef]);
  return (
    <>
      <textarea
        ref={textAreaRef}
        {...props}
        className={`textarea ${props.className || ""}`}
      />
      <div
        style={{
          visibility: "hidden",
          position: "absolute",
          width: textAreaWidth || 500,
          height: 0,
          left: 0,
          top: 0,
        }}
        aria-hidden="true"
      >
        <textarea
          ref={setHiddenTextArea}
          className={`textarea ${props.className || ""} min-h-0`}
          style={{ height: 0 }}
          tabIndex={-1}
        />
      </div>
    </>
  );
};