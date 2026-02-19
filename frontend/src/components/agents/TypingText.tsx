"use client";

import { useTypingAnimation } from "@/hooks/useTypingAnimation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface TypingTextProps {
  text: string;
  className?: string;
  onComplete?: () => void;
  speed?: number;
}

export function TypingText({ text, className, onComplete, speed = 40 }: TypingTextProps) {
  const { displayedText, isTyping } = useTypingAnimation(text, speed);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!isTyping && onComplete) {
      onComplete();
    }
  }, [isTyping, onComplete]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span className={cn("font-mono text-xs md:text-sm tracking-wide", className)}>
      {displayedText}
      <span className={cn("ml-0.5 inline-block w-1.5 h-3 bg-neon-cyan align-middle", showCursor ? "opacity-100" : "opacity-0")} />
    </span>
  );
}
