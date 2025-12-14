import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Panel from "@/app/components/ui/Panel";
import { SPEAKER_IMAGES, BACKGROUND_IMAGES } from "@/constants/game";
import {
  DialogLine,
  SpeakerImageKey,
  BackgroundImageKey,
} from "@/types/baseGame";

interface StoryScreenProps {
  sequence: DialogLine[];
  onContinue: () => void;
  isLoading?: boolean;
  backgroundImageKey: BackgroundImageKey;
}

export default function DialogScreen({
  sequence,
  onContinue,
  isLoading,
  backgroundImageKey,
}: StoryScreenProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      // Next line
      if (lineIndex < sequence.length - 1) {
        setLineIndex((prev) => prev + 1);
      } else {
        onContinue();
      }
    }
  };

  const getPortrait = (portraitKey: SpeakerImageKey) => {
    if (SPEAKER_IMAGES[portraitKey]) return SPEAKER_IMAGES[portraitKey];
    // Fallback to default
    return SPEAKER_IMAGES[SpeakerImageKey.DEFAULT];
  };

  const getDisplayName = (line: DialogLine) => {
    return line.displayName;
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
      {/* Portrait Container - Flex Centered */}
      <div className="flex-1 flex flex-col justify-center items-center z-10 pb-32 md:pb-40 w-full">
        {currentLine.portraitKey !== SpeakerImageKey.EMPTY && (
          <div
            className={`transition-all duration-500 transform flex flex-col items-center ${
              isTyping ? "scale-105 brightness-110" : "scale-100 brightness-100"
            }`}
          >
            <Image
              src={getPortrait(currentLine.portraitKey)}
              alt={getDisplayName(currentLine)}
              width={512}
              height={512}
              className="w-80 h-80 md:w-96 md:h-96 object-cover border-4 border-wood rounded-lg shadow-2xl bg-black"
              unoptimized
            />
            <div className="bg-wood text-sand font-bold text-center py-2 px-6 mt-4 border-2 border-black rounded shadow-lg uppercase tracking-wider text-lg">
              {getDisplayName(currentLine)}
            </div>
          </div>
        )}
      </div>

      {/* Dialog Box */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-20">
        <Panel className="min-h-40 flex flex-col justify-start items-start bg-ocean-dark/95 border-wood-light">
          <div className="text-xl md:text-2xl text-sand font-mono leading-relaxed drop-shadow-md">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-3 h-6 bg-cyan-400 ml-1 align-middle animate-pulse"></span>
            )}
          </div>

          {!isTyping && (
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
