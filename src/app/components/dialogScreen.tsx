import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Panel from "@/app/components/ui/Panel";
import { SPEAKER_IMAGES, BACKGROUND_IMAGES } from "@/constants/game";
import {
  DialogLine,
  SpeakerImageKey,
  BackgroundImageKey,
  DialogPortrait,
  DialogButton,
  getButtonClasses,
} from "@/types/baseGame";
import {
  validateLineIds,
  findLineIndexById,
} from "@/utils/dialogLineValidator";

interface StoryScreenProps {
  sequence: DialogLine[];
  onContinue: () => void;
  isLoading?: boolean;
  backgroundImageKey: BackgroundImageKey;
  dialogName?: string; // Optional name for error messages
}

export default function DialogScreen({
  sequence,
  onContinue,
  isLoading,
  backgroundImageKey,
  dialogName,
}: StoryScreenProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Validate line IDs on mount and when sequence changes
  useEffect(() => {
    validateLineIds(sequence, dialogName);
  }, [sequence, dialogName]);

  // Check if current line has an interactive portrait
  const hasInteractivePortrait = () => {
    if (!currentLine || !currentLine.portraits) return false;
    return currentLine.portraits.some((p) => p.onClick !== undefined);
  };

  // Check if current line has buttons
  const hasButtons = () => {
    return currentLine && currentLine.buttons && currentLine.buttons.length > 0;
  };

  // Reset state when sequence changes to support dialog chaining
  useEffect(() => {
    setLineIndex(0);
    setDisplayedText("");
    setIsTyping(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [sequence]);

  const currentLine = sequence[lineIndex];

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;

    setDisplayedText("");
    setIsTyping(true);
    let charIndex = 0;

    intervalRef.current = setInterval(() => {
      charIndex++;
      if (charIndex <= currentLine.text.length) {
        setDisplayedText(currentLine.text.slice(0, charIndex));
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
      }
    }, 25); // Speed of typing

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentLine, lineIndex]); // Re-run when line changes

  const handleClick = () => {
    if (isLoading) return;

    if (isTyping) {
      // Complete text immediately and stop the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      // Only allow advancing if there's no interactive portrait and no buttons
      if (!hasInteractivePortrait() && !hasButtons()) {
        // Next line
        if (lineIndex < sequence.length - 1) {
          setLineIndex((prev) => prev + 1);
        } else {
          onContinue();
        }
      }
    }
  };

  const handlePortraitClick = (portrait: DialogPortrait) => {
    if (portrait.onClick) {
      portrait.onClick();
    }
  };

  const jumpToLine = (lineId: string) => {
    const targetIndex = findLineIndexById(sequence, lineId, dialogName);
    setLineIndex(targetIndex);
    setDisplayedText("");
    setIsTyping(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleButtonClick = (button: DialogButton) => {
    // Execute jump immediately if specified (for responsiveness)
    if (button.jumpToLineId) {
      jumpToLine(button.jumpToLineId);
    }

    // Then call onClick handler if it exists
    if (button.onClick) {
      button.onClick();
    }
  };

  const getPortrait = (portraitKey: SpeakerImageKey) => {
    if (SPEAKER_IMAGES[portraitKey]) return SPEAKER_IMAGES[portraitKey];
    // Fallback to default
    return SPEAKER_IMAGES[SpeakerImageKey.DEFAULT];
  };

  const getDisplayName = (portraits: DialogPortrait[], idx: number) => {
    if (!portraits || portraits.length === 0) return "";
    if (idx < 0 || idx >= portraits.length) return portraits[0].displayName;
    return portraits[idx].displayName;
  };

  const getBackgroundImage = (backgroundImageKey: BackgroundImageKey) => {
    if (BACKGROUND_IMAGES[backgroundImageKey])
      return BACKGROUND_IMAGES[backgroundImageKey];
    return BACKGROUND_IMAGES[BackgroundImageKey.DEFAULT];
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400"></div>
        <p className="mt-4 text-sand text-lg animate-pulse">
          Consulting the stars...
        </p>
      </div>
    );
  }

  if (!currentLine) return null;

  return (
    <div
      className="flex flex-col h-full relative cursor-pointer"
      onClick={handleClick}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-black/60 z-0">
        <Image
          src={getBackgroundImage(backgroundImageKey)}
          alt="Story background"
          fill
          className="object-cover opacity-50"
          unoptimized
          priority
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 md:p-8">
        {/* Portrait row (supports up to 3 portraits) */}
        {currentLine.portraits && currentLine.portraits.length > 0 && (
          <div className="flex justify-center flex-1">
            <div className="flex  items-center space-x-6 md:space-x-8">
              {currentLine.portraits
                .filter((p) => p.key !== SpeakerImageKey.EMPTY)
                .slice(0, 3)
                .map((p, i) => {
                  const portraitCount = Math.min(
                    currentLine.portraits.length,
                    3
                  );
                  const activeIndex = Math.max(
                    0,
                    Math.min(
                      currentLine.speakerIndex || 0,
                      currentLine.portraits.length - 1
                    )
                  );
                  const isActive = i === activeIndex;

                  // Size strategy: single portrait is very large; 2-3 portraits slightly smaller but still prominent
                  let imgClass = "w-40 h-40 md:w-56 md:h-56";
                  let imgWidth = 256;
                  let imgHeight = 256;
                  if (portraitCount === 1) {
                    imgClass = "w-80 h-80 md:w-96 md:h-96";
                    imgWidth = 512;
                    imgHeight = 512;
                  } else if (portraitCount === 2) {
                    imgClass = "w-64 h-64 md:w-80 md:h-80";
                    imgWidth = 384;
                    imgHeight = 384;
                  } else if (portraitCount === 3) {
                    imgClass = "w-64 h-64 md:w-80 md:h-80";
                    imgWidth = 384;
                    imgHeight = 384;
                  }

                  return (
                    <div
                      key={`${p.key}-${i}`}
                      className={`transition-all duration-500 transform flex flex-col items-center scale-105 brightness-110 ${
                        p.onClick ? "cursor-pointer hover:scale-110" : ""
                      }`}
                      onClick={(e) => {
                        if (!p.onClick) return;
                        e.stopPropagation();
                        handlePortraitClick(p);
                      }}
                    >
                      <Image
                        src={getPortrait(p.key)}
                        alt={p.displayName}
                        width={imgWidth}
                        height={imgHeight}
                        className={`${imgClass} object-cover border-4 ${
                          p.onClick ? "border-cyan-400" : "border-wood"
                        } rounded-lg shadow-2xl bg-black transition-all duration-300`}
                        unoptimized
                      />
                      <div className="bg-wood text-sand font-bold text-center py-1 mt-2 border-2 border-black rounded shadow-lg uppercase tracking-wider text-sm md:text-base">
                        {p.displayName}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Dialog Box */}
        <Panel className="min-h-40 flex flex-col justify-start items-start bg-ocean-dark/95 border-wood-light">
          <div className="text-xl md:text-2xl text-sand font-mono leading-relaxed drop-shadow-md">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-3 h-6 bg-cyan-400 ml-1 align-middle animate-pulse"></span>
            )}
          </div>

          {!isTyping && hasButtons() && (
            <div className="w-full mt-6 flex flex-wrap justify-center gap-4">
              {currentLine.buttons?.map((button, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleButtonClick(button);
                  }}
                  className={getButtonClasses(button.type)}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}

          {!isTyping && !hasInteractivePortrait() && !hasButtons() && (
            <div className="self-end mt-auto animate-bounce text-cyan-400 text-sm font-bold uppercase tracking-widest">
              {lineIndex < sequence.length - 1
                ? "Click to Continue ▼"
                : "Click to Proceed ►"}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
