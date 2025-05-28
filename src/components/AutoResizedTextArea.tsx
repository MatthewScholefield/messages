import { useCallback, useEffect, useRef, useState } from "react";
import { useMeasure } from "@uidotdev/usehooks";

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
  const [measureRef, { width: textAreaWidth }] = useMeasure<HTMLTextAreaElement>();

  hiddenTextAreaRef.current = hiddenTextArea;

  useEffect(() => {
    if (autoFocus && textArea) {
      textArea.focus();
    }
  }, [autoFocus, textArea]);

  useEffect(() => {
    if (textArea && hiddenTextArea && textAreaWidth) {
      hiddenTextArea.style.width = `${textAreaWidth}px`;
      hiddenTextArea.value = props.value as string;
      const totalTextHeight = hiddenTextArea.scrollHeight;

      textArea.style.height = `${totalTextHeight}px`;
      textArea.style.maxHeight = `${totalTextHeight}px`;
    }
  }, [props.value, textArea, hiddenTextArea, textAreaWidth]);

  const textAreaRef = useCallback((node: HTMLTextAreaElement | null) => {
          setTextArea(node);
          measureRef(node);
        }, [measureRef]);
  return (
    <>
      <textarea
        ref={textAreaRef}
        {...props}
        className={`textarea ${props.className || ""} min-h-0`}
      />
      <div
        style={{
          visibility: "hidden",
          position: "absolute",
          height: 0,
          left: 0,
          top: 0,
          userSelect: "none"
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