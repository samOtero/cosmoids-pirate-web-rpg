import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Panel from "@/app/components/ui/Panel";
import { SPEAKER_IMAGES } from "@/constants/game";
import { DialogLine } from "@/types/baseGame";

interface StoryScreenProps {
  sequence: DialogLine[];
  onContinue: () => void;
  isLoading?: boolean;
}

export default function DialogScreen({
  sequence,
  onContinue,
  isLoading,
}: StoryScreenProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const getPortrait = (portraitKey: string) => {
    if (SPEAKER_IMAGES[portraitKey]) return SPEAKER_IMAGES[portraitKey];
    // Fallback to default
    return SPEAKER_IMAGES["default"];
  };

  const getDisplayName = (line: DialogLine) => {
    return line.displayName;
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
          src="/bg_caleb_house_1.png"
          alt="Story background"
          fill
          className="object-cover opacity-50"
          unoptimized
          priority
        />
      </div>

      {/* Portrait - positioned on left, above dialog */}
      <div className="absolute bottom-44 md:bottom-52 left-8 md:left-12 z-30">
        <div
          className={`transition-all duration-500 transform ${
            isTyping ? "scale-105 brightness-110" : "scale-100 brightness-100"
          }`}
        >
          <Image
            src={getPortrait(currentLine.portraitKey)}
            alt={getDisplayName(currentLine)}
            width={256}
            height={256}
            className="w-48 h-48 md:w-64 md:h-64 object-cover border-4 border-wood rounded-lg shadow-2xl bg-black"
            unoptimized
          />
          <div className="bg-wood text-sand font-bold text-center py-1 mt-2 border-2 border-black rounded shadow-lg uppercase tracking-wider">
            {getDisplayName(currentLine)}
          </div>
        </div>
      </div>

      {/* Dialog Box */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-20">
        <Panel className="min-h-[160px] flex flex-col justify-start items-start bg-ocean-dark/95 border-wood-light">
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
