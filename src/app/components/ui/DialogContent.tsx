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
  allowSkip?: boolean;
}

export default function DialogContent({
  sequence,
  onContinue,
  onDialogAction,
  dialogName,
  initialLineIndex = 0,
  allowSkip = true,
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
    let contentWrapperClasses = 'relative z-10 flex flex-col p-2';
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
                        className="transition-all duration-500 transform flex flex-col items-center scale-105 brightness-110"
                      >
                        <Image
                          src={getPortrait(p.key)}
                          alt={p.displayName}
                          width={256}
                          height={256}
                          className={`${imgClass} object-cover border-4 border-wood rounded-lg shadow-2xl bg-black transition-all duration-300`}
                          unoptimized
                          draggable={false}
                        />
                        <div className="bg-wood text-sand font-bold text-center py-1 px-2 mt-1 border-2 border-black rounded shadow-lg uppercase tracking-wider text-xs leading-tight w-full max-w-[95%]">
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
      <div className="flex items-center justify-center gap-3 md:gap-6">
        {filteredPortraits.map((p, i) => {
          let imgClass = 'w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72';
          let imgWidth = 256;
          let imgHeight = 256;

          if (p.portraitWidth === 'wide') {
            imgClass = 'w-72 h-56 sm:w-96 sm:h-72 md:w-[28rem] md:h-80';
            imgWidth = 448;
            imgHeight = 320;
          } else if (portraitCount === 1) {
            imgClass = 'w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96';
            imgWidth = 512;
            imgHeight = 512;
          } else if (portraitCount === 2) {
            imgClass = 'w-36 h-36 sm:w-56 sm:h-56 md:w-80 md:h-80';
            imgWidth = 384;
            imgHeight = 384;
          } else if (portraitCount === 3) {
            imgClass =
              'w-24 h-24 sm:w-36 sm:h-36 md:w-64 md:h-64 lg:w-80 lg:h-80';
            imgWidth = 384;
            imgHeight = 384;
          }

          return (
            <div
              key={`${p.key}-${i}`}
              className="transition-all duration-500 transform flex flex-col items-center scale-105 brightness-110 landscape:scale-100"
            >
              <Image
                src={getPortrait(p.key)}
                alt={p.displayName}
                width={imgWidth}
                height={imgHeight}
                className={`${imgClass} landscape:!w-auto landscape:!h-full landscape:max-h-[40vh] object-cover border-4 border-wood rounded-lg shadow-2xl bg-black transition-all duration-300`}
                unoptimized
                draggable={false}
              />
              <div className="bg-wood text-sand font-bold text-center py-1 px-2 mt-2 landscape:mt-1 border-2 border-black rounded shadow-lg uppercase tracking-wider text-xs sm:text-sm md:text-base leading-tight w-full max-w-[95%]">
                {p.displayName}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const dialogPanelClasses =
    'min-h-28 sm:min-h-32 md:min-h-40 flex flex-col justify-start items-start bg-ocean-dark/95 border-wood-light relative';

  return (
    <div
      className="flex flex-col h-full relative cursor-pointer select-none"
      onClick={handleGlobalClick}
    >
      {/* Content: portrait-mode = vertical stack, landscape-mode = side-by-side */}
      <div className="relative z-10 flex-1 flex flex-col landscape:flex-row justify-between landscape:items-stretch p-3 sm:p-4 md:p-8 gap-2 landscape:gap-4 overflow-hidden">
        {/* Portrait area */}
        {hasPortraits && (
          <div className="flex justify-center items-center flex-1 landscape:flex-none landscape:w-[40%] landscape:max-w-[45%] min-h-0">
            {renderPortraits()}
          </div>
        )}

        {/* Dialog panel */}
        <div className="flex flex-col landscape:flex-1 min-h-0">
          <Panel className={dialogPanelClasses}>{renderDialogText()}</Panel>
        </div>
      </div>
    </div>
  );

  function renderDialogText() {
    return (
      <>
        {allowSkip && !hasButtons() && (
          <div
            className="absolute top-2 right-2 cursor-pointer p-2 hover:bg-white/10 rounded transition-colors group z-50"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
          >
            <span className="text-sand/50 text-xs font-bold uppercase tracking-widest group-hover:text-sand">
              Skip
            </span>
          </div>
        )}
        <div className="text-base sm:text-lg md:text-2xl text-sand font-mono leading-relaxed drop-shadow-md">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-3 h-5 sm:h-6 bg-cyan-400 ml-1 align-middle animate-pulse"></span>
          )}
        </div>

        {!isTyping && hasButtons() && (
          <div className="w-full mt-4 sm:mt-6 flex flex-wrap justify-center gap-3 sm:gap-4">
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
            className="self-end mt-auto cursor-pointer p-3 sm:p-4 md:p-6 -mr-2 sm:-mr-4 -mb-2 sm:-mb-4 hover:bg-white/5 rounded-lg transition-colors group"
            onClick={(e) => {
              e.stopPropagation();
              handleAdvance();
            }}
          >
            <div className="animate-bounce text-cyan-400 text-xs sm:text-sm font-bold uppercase tracking-widest group-hover:text-cyan-300">
              {lineIndex < sequence.length - 1 ? 'Continue ▼' : 'Proceed ►'}
            </div>
          </div>
        )}
      </>
    );
  }
}
