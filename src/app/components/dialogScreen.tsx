import { useEffect, useState } from "react";
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

  const currentLine = sequence[lineIndex];

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;

    setDisplayedText("");
    setIsTyping(true);
    let charIndex = 0;

    const interval = setInterval(() => {
      charIndex++;
      if (charIndex <= currentLine.text.length) {
        setDisplayedText(currentLine.text.slice(0, charIndex));
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25); // Speed of typing

    return () => clearInterval(interval);
  }, [currentLine, lineIndex]); // Re-run when line changes

  const handleClick = () => {
    if (isLoading) return;

    if (isTyping) {
      // Complete text immediately
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

  const getPortrait = (speaker: string) => {
    if (SPEAKER_IMAGES[speaker]) return SPEAKER_IMAGES[speaker];
    // Try to find if speaker matches player name, if so use a player avatar placeholder
    // For now, fallback to default
    return SPEAKER_IMAGES["default"];
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
        <img
          src="https://picsum.photos/seed/ocean_story_bg/1920/1080"
          className="w-full h-full object-cover opacity-30 grayscale"
        />
      </div>

      {/* Characters Area */}
      <div className="flex-1 flex items-end justify-center px-8 pb-32 relative z-10 max-w-6xl mx-auto w-full">
        {/* Portrait */}
        <div
          className={`transition-all duration-500 transform ${
            isTyping ? "scale-105 brightness-110" : "scale-100 brightness-100"
          }`}
        >
          <img
            src={getPortrait(currentLine.speaker)}
            alt={currentLine.speaker}
            className="w-48 h-48 md:w-64 md:h-64 object-cover border-4 border-wood rounded-lg shadow-2xl bg-black"
          />
          <div className="bg-wood text-sand font-bold text-center py-1 mt-2 border-2 border-black rounded shadow-lg uppercase tracking-wider">
            {currentLine.speaker}
          </div>
        </div>
      </div>

      {/* Dialog Box */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-20">
        <Panel className="min-h-[160px] flex flex-col justify-start items-start bg-ocean-dark/95 border-wood-light">
          <div className="text-xl md:text-2xl text-sand font-mono leading-relaxed drop-shadow-md">
            {displayedText}
            <span
              className={`inline-block w-3 h-6 bg-cyan-400 ml-1 align-middle ${
                isTyping ? "animate-pulse" : "hidden"
              }`}
            ></span>
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
