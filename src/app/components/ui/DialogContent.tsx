import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Panel from '@/app/components/ui/Panel';
import { SPEAKER_IMAGES } from '@/constants/game';
import {
  DialogLine,
  SpeakerImageKey,
  DialogButton,
  getButtonClasses,
  DialogAction,
} from '@/types/baseGame';
import {
  validateLineIds,
  findLineIndexById,
} from '@/utils/dialogLineValidator';

interface DialogContentProps {
  sequence: DialogLine[];
  onContinue: () => void;
  onDialogAction: (action: DialogAction) => void;
  dialogName?: string;
  initialLineIndex?: number;
}

export default function DialogContent({
  sequence,
  onContinue,
  onDialogAction,
  dialogName,
  initialLineIndex = 0,
}: DialogContentProps) {
  const [lineIndex, setLineIndex] = useState(initialLineIndex);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Validate line IDs on mount and when sequence changes
  useEffect(() => {
    validateLineIds(sequence, dialogName);
  }, [sequence, dialogName]);

  // Check if current line has buttons
  const hasButtons = () => {
    return currentLine && currentLine.buttons && currentLine.buttons.length > 0;
  };

  // Reset state when sequence changes to support dialog chaining
  useEffect(() => {
    setLineIndex(initialLineIndex);
    setDisplayedText('');
    setIsTyping(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [sequence, initialLineIndex]);

  const currentLine = sequence[lineIndex];

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;

    setDisplayedText('');
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

  const handleGlobalClick = () => {
    if (isTyping) {
      // Complete text immediately and stop the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    }
  };

  const handleAdvance = () => {
    // Only allow advancing if there are no buttons
    if (!hasButtons()) {
      // Next line
      if (lineIndex < sequence.length - 1) {
        setLineIndex((prev) => prev + 1);
      } else {
        onContinue();
      }
    }
  };

  const jumpToLine = (lineId: string) => {
    const targetIndex = findLineIndexById(sequence, lineId, dialogName);
    setLineIndex(targetIndex);
    setDisplayedText('');
    setIsTyping(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleButtonClick = (button: DialogButton) => {
    // Then handle action if it exists
    if (button.action) {
      onDialogAction(button.action);
    }
    // Execute jump immediately if specified (for responsiveness)
    if (button.jumpToLineId) {
      jumpToLine(button.jumpToLineId);
    }
  };

  const getPortrait = (portraitKey: SpeakerImageKey) => {
    if (SPEAKER_IMAGES[portraitKey]) return SPEAKER_IMAGES[portraitKey];
    // Fallback to default
    return SPEAKER_IMAGES[SpeakerImageKey.DEFAULT];
  };

  if (!currentLine) return null;

  const layout = currentLine.layout || 'default';

  // Base container classes
  let containerClasses =
    'flex flex-col h-full relative cursor-pointer select-none';
  let contentWrapperClasses =
    'relative z-10 flex-1 flex flex-col justify-between p-4 md:p-8';
  let portraitContainerClasses = 'flex justify-center flex-1';
  let dialogPanelContainerClasses =
    'min-h-40 flex flex-col justify-start items-start bg-ocean-dark/95 border-wood-light';

  if (layout === 'battle-left') {
    // Position fixed bottom-left
    containerClasses =
      'absolute bottom-4 left-4 w-[45%] h-auto cursor-pointer select-none';
    contentWrapperClasses = 'relative z-10 flex flex-col p-2';
    // Portrait aligned left-ish or centered within the smaller box
    portraitContainerClasses = 'flex justify-start mb-2 pl-4';
    // Remove flex-1 from portrait so it doesn't take up empty space
  } else if (layout === 'battle-right') {
    // Position fixed bottom-right
    containerClasses =
      'absolute bottom-4 right-4 w-[45%] h-auto cursor-pointer select-none';
    contentWrapperClasses = 'relative z-10 flex flex-col p-2';
    portraitContainerClasses = 'flex justify-end mb-2 pr-4';
  }

  return (
    <div className={containerClasses} onClick={handleGlobalClick}>
      {/* Content Container */}
      <div className={contentWrapperClasses}>
        {/* Portrait row (supports up to 3 portraits) */}
        {currentLine.portraits && currentLine.portraits.length > 0 && (
          <div className={portraitContainerClasses}>
            <div className="flex items-center space-x-4 md:space-x-6">
              {currentLine.portraits
                .filter((p) => p.key !== SpeakerImageKey.EMPTY)
                .slice(0, 3)
                .map((p, i) => {
                  const portraitCount = Math.min(
                    currentLine.portraits.length,
                    3
                  );

                  // Size strategy: Determine based on layout
                  // In battle layouts, we want smaller portraits usually
                  let imgClass = 'w-40 h-40 md:w-56 md:h-56';
                  if (layout !== 'default') {
                    imgClass = 'w-24 h-24 md:w-32 md:h-32';
                  }

                  let imgWidth = 256;
                  let imgHeight = 256;

                  if (layout === 'default') {
                    if (p.portraitWidth === 'wide') {
                      // Wide portraits: rectangular aspect ratio (4:3)
                      imgClass = 'w-96 h-72 md:w-[28rem] md:h-80';
                      imgWidth = 448;
                      imgHeight = 320;
                    } else if (portraitCount === 1) {
                      imgClass = 'w-80 h-80 md:w-96 md:h-96';
                      imgWidth = 512;
                      imgHeight = 512;
                    } else if (portraitCount === 2) {
                      imgClass = 'w-64 h-64 md:w-80 md:h-80';
                      imgWidth = 384;
                      imgHeight = 384;
                    } else if (portraitCount === 3) {
                      imgClass = 'w-64 h-64 md:w-80 md:h-80';
                      imgWidth = 384;
                      imgHeight = 384;
                    }
                  } else {
                    // Battle modes - keep it compact
                    // If wide, just make it a bit wider
                    if (p.portraitWidth === 'wide') {
                      imgClass = 'w-48 h-36 md:w-64 md:h-48';
                    }
                  }

                  return (
                    <div
                      key={`${p.key}-${i}`}
                      className="transition-all duration-500 transform flex flex-col items-center scale-105 brightness-110"
                    >
                      <Image
                        src={getPortrait(p.key)}
                        alt={p.displayName}
                        width={imgWidth}
                        height={imgHeight}
                        className={`${imgClass} object-cover border-4 border-wood rounded-lg shadow-2xl bg-black transition-all duration-300`}
                        unoptimized
                        draggable={false}
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
        <Panel className={dialogPanelContainerClasses}>
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

          {!isTyping && !hasButtons() && (
            <div
              className="self-end mt-auto cursor-pointer p-6 -mr-4 -mb-4 hover:bg-white/5 rounded-lg transition-colors group"
              onClick={(e) => {
                e.stopPropagation();
                handleAdvance();
              }}
            >
              <div className="animate-bounce text-cyan-400 text-sm font-bold uppercase tracking-widest group-hover:text-cyan-300">
                {lineIndex < sequence.length - 1
                  ? 'Click to Continue ▼'
                  : 'Click to Proceed ►'}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
