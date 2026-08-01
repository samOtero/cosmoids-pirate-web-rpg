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
  GameFlag,
} from '@/types/baseGame';
import {
  validateLineIds,
  findLineIndexById,
} from '@/utils/dialogLineValidator';
import { useGameStore } from '@/store/gameStore';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';

interface DialogContentProps {
  sequence: DialogLine[];
  onContinue: () => void;
  onDialogAction: (action: DialogAction) => void;
  onLineChange?: (lineIndex: number) => void;
  dialogName?: string;
  initialLineIndex?: number;
  allowSkip?: boolean;
  enableTyping?: boolean;
}

const TYPING_SPEED = 10; // Speed of typing in milliseconds per character

export default function DialogContent({
  sequence,
  onContinue,
  onDialogAction,
  onLineChange,
  dialogName,
  initialLineIndex = 0,
  allowSkip = true,
  enableTyping = true,
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

  useEffect(() => {
    onLineChange?.(lineIndex);
  }, [lineIndex, onLineChange]);

  // Get current starter name from store based on game flags (immune to party re-ordering/storage moves)
  const { profiles, currentProfileId } = useGameStore();
  const currentProfile =
    currentProfileId !== null ? profiles[currentProfileId] : null;

  let starterName = 'your Cosmoid';
  if (currentProfile?.gameFlags) {
    if (currentProfile.gameFlags.includes(GameFlag.STARTER_PALMIT)) {
      starterName = STARTER_CRAB.name;
    } else if (currentProfile.gameFlags.includes(GameFlag.STARTER_FUEGUANA)) {
      starterName = STARTER_IGUANA.name;
    } else if (currentProfile.gameFlags.includes(GameFlag.STARTER_MONKEG)) {
      starterName = STARTER_MONKEY.name;
    }
  }

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;

    const textToType = currentLine.text.replace(/{StarterName}/g, starterName);

    // If typing is disabled, show full text immediately
    if (!enableTyping) {
      setDisplayedText(textToType);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let charIndex = 0;

    intervalRef.current = setInterval(() => {
      charIndex++;
      if (charIndex <= textToType.length) {
        setDisplayedText(textToType.slice(0, charIndex));
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
      }
    }, TYPING_SPEED); // Speed of typing

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentLine, lineIndex, enableTyping, starterName]); // Re-run when line changes or starterName changes

  const handleGlobalClick = () => {
    if (isTyping) {
      // Complete text immediately and stop the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const textToType = currentLine.text.replace(
        /{StarterName}/g,
        starterName
      );
      setDisplayedText(textToType);
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

  const handleSkip = () => {
    // Find next line with an ID
    let nextIdIndex = -1;
    for (let i = lineIndex + 1; i < sequence.length; i++) {
      if (sequence[i].id) {
        nextIdIndex = i;
        break;
      }
    }

    if (nextIdIndex !== -1) {
      setLineIndex(nextIdIndex);
      setDisplayedText('');
      setIsTyping(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      onContinue();
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
  const isDefaultLayout = layout === 'default';
  const hasPortraits =
    currentLine.portraits && currentLine.portraits.length > 0;

  // For battle layouts, keep the original absolute-positioned approach
  if (!isDefaultLayout) {
    let containerClasses = '';
    const contentWrapperClasses = 'relative z-10 flex flex-col p-2';
    let portraitContainerClasses = '';
    const dialogPanelContainerClasses =
      'min-h-32 sm:min-h-40 flex flex-col justify-start items-start bg-ocean-dark/95 border-wood-light relative';

    if (layout === 'battle-left') {
      containerClasses =
        'absolute bottom-4 left-4 w-[45%] h-auto cursor-pointer select-none';
      portraitContainerClasses = 'flex justify-start mb-2 pl-4';
    } else if (layout === 'battle-right') {
      containerClasses =
        'absolute bottom-4 right-4 w-[45%] h-auto cursor-pointer select-none';
      portraitContainerClasses = 'flex justify-end mb-2 pr-4';
    }

    return (
      <div className={containerClasses} onClick={handleGlobalClick}>
        <div className={contentWrapperClasses}>
          {hasPortraits && (
            <div className={portraitContainerClasses}>
              <div className="flex items-center space-x-4 md:space-x-6">
                {currentLine.portraits
                  .filter((p) => p.key !== SpeakerImageKey.EMPTY)
                  .slice(0, 3)
                  .map((p, i) => {
                    let imgClass = 'w-24 h-24 md:w-32 md:h-32';
                    if (p.portraitWidth === 'wide') {
                      imgClass = 'w-40 h-32 sm:w-48 sm:h-36 md:w-64 md:h-48';
                    }
                    return (
                      <div
                        key={`${p.key}-${i}`}
                        className="flex scale-105 transform flex-col items-center brightness-110 transition-all duration-500"
                      >
                        <Image
                          src={getPortrait(p.key)}
                          alt={p.displayName}
                          width={256}
                          height={256}
                          className={`${imgClass} rounded-lg border-4 border-wood bg-black object-cover shadow-2xl transition-all duration-300 ${p.flipped ? 'scale-x-[-1]' : ''}`}
                          unoptimized
                          draggable={false}
                        />
                        <div className="mt-1 w-full max-w-[95%] rounded border-2 border-black bg-wood px-2 py-1 text-center text-xs leading-tight font-bold tracking-wider text-sand uppercase shadow-lg">
                          {p.displayName}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
          <Panel className={dialogPanelContainerClasses}>
            {renderDialogText()}
          </Panel>
        </div>
      </div>
    );
  }

  // === DEFAULT LAYOUT ===
  // In landscape: side-by-side (portrait left, dialog right)
  // In portrait: stacked vertically (portrait top, dialog bottom)

  const renderPortraits = () => {
    if (!hasPortraits) return null;

    const filteredPortraits = currentLine.portraits
      .filter((p) => p.key !== SpeakerImageKey.EMPTY)
      .slice(0, 3);

    if (filteredPortraits.length === 0) return null;

    const portraitCount = filteredPortraits.length;

    return (
      <div className="flex items-center justify-center gap-6">
        {filteredPortraits.map((p, i) => {
          let imgWidth = 256;
          let imgHeight = 256;

          if (p.portraitWidth === 'wide') {
            imgWidth = 448;
            imgHeight = 320;
          } else if (portraitCount === 1) {
            imgWidth = 512;
            imgHeight = 512;
          } else if (portraitCount === 2) {
            imgWidth = 384;
            imgHeight = 384;
          } else if (portraitCount === 3) {
            imgWidth = 384;
            imgHeight = 384;
          }

          return (
            <div
              key={`${p.key}-${i}`}
              className="flex transform flex-col items-center brightness-110 transition-all duration-500"
            >
              <Image
                src={getPortrait(p.key)}
                alt={p.displayName}
                width={imgWidth}
                height={imgHeight}
                className={`h-full max-h-[40vh] w-auto rounded-lg border-4 border-wood bg-black object-cover shadow-2xl transition-all duration-300 ${p.flipped ? 'scale-x-[-1]' : ''}`}
                unoptimized
                draggable={false}
              />
              <div className="mt-1 w-full max-w-[95%] rounded border-2 border-black bg-wood px-2 py-1 text-center text-sm leading-tight font-bold tracking-wider text-sand uppercase shadow-lg lg:mt-2 lg:text-base">
                {p.displayName}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="relative flex h-full cursor-pointer flex-col select-none"
      onClick={handleGlobalClick}
    >
      {/* Skip button — top-right of screen */}
      {allowSkip && !hasButtons() && (
        <div
          className="absolute top-3 right-3 z-50 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
        >
          <div className="rounded-md border border-red-800 bg-red-600 px-3 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-lg transition-colors hover:bg-red-500 active:bg-red-700">
            Skip
          </div>
        </div>
      )}

      {/* Continue/Proceed button — floating bottom-right */}
      {!hasButtons() && !isTyping && (
        <div
          className="group absolute right-3 bottom-3 z-50 cursor-pointer rounded-lg p-2 transition-colors hover:bg-white/5 sm:right-4 sm:bottom-4"
          onClick={(e) => {
            e.stopPropagation();
            handleAdvance();
          }}
        >
          <div className="rounded-md border border-green-800 bg-green-600 px-3 py-1.5 text-base font-bold tracking-widest text-white uppercase shadow-lg transition-colors hover:bg-green-500 active:bg-green-700 lg:px-6 lg:text-2xl">
            Next ►
          </div>
        </div>
      )}

      {/* Choice buttons — floating bottom-center */}
      {hasButtons() && !isTyping && (
        <div className="absolute bottom-3 left-1/2 z-50 flex -translate-x-1/2 animate-[fadeIn_0.3s_ease-in] justify-center gap-2 sm:gap-3 lg:bottom-16">
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

      {/* Content: always vertical stack, portrait on top, dialog on bottom */}
      <div className="relative z-10 flex flex-1 flex-col justify-between gap-1 overflow-hidden p-8">
        {/* Portrait area */}
        {hasPortraits && (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            {renderPortraits()}
          </div>
        )}

        {/* Dialog panel — text only */}
        <div className="flex min-h-0 shrink-0 flex-col">
          <Panel className="relative flex h-28 flex-col items-start justify-start border-wood-light bg-ocean-dark/95 lg:h-48">
            {renderDialogText()}
          </Panel>
        </div>
      </div>
    </div>
  );

  function renderDialogText() {
    return (
      <div className="font-mono text-base leading-snug text-sand lg:text-2xl">
        {displayedText}
        {isTyping && (
          <span className="ml-1 inline-block h-5 w-3 animate-pulse bg-cyan-400 align-middle sm:h-6"></span>
        )}
      </div>
    );
  }
}
