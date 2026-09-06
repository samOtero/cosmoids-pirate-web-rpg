import { useState } from 'react';
import Image from 'next/image';
import { BACKGROUND_IMAGES } from '@/constants/game';
import {
  DialogLine,
  BackgroundImageKey,
  DialogAction,
  SpeakerImageKey,
} from '@/types/baseGame';
import DialogContent from '@/app/components/ui/DialogContent';

interface DialogScreenProps {
  sequence: DialogLine[];
  onContinue: () => void;
  onDialogAction: (action: DialogAction) => void;
  isLoading?: boolean;
  backgroundImageKey: BackgroundImageKey;
  dialogName?: string; // Optional name for error messages
  initialLineIndex?: number;
}

export default function DialogScreen({
  sequence,
  onContinue,
  onDialogAction,
  isLoading,
  backgroundImageKey,
  dialogName,
  initialLineIndex = 0,
}: DialogScreenProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(initialLineIndex);

  const getBackgroundImage = (backgroundImageKey: BackgroundImageKey) => {
    if (BACKGROUND_IMAGES[backgroundImageKey])
      return BACKGROUND_IMAGES[backgroundImageKey];
    return BACKGROUND_IMAGES[BackgroundImageKey.DEFAULT];
  };

  const currentLine = sequence[currentLineIndex];
  const activeBackgroundImageKey =
    currentLine?.backgroundImageKey ?? backgroundImageKey;
  const isNarrationOnly = !currentLine?.portraits?.some(
    (portrait) => portrait.key !== SpeakerImageKey.EMPTY
  );

  if (isLoading) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center p-8">
        <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-cyan-400"></div>
        <p className="mt-4 animate-pulse text-lg text-sand">
          Consulting the stars...
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-black/60">
        <Image
          src={getBackgroundImage(activeBackgroundImageKey)}
          alt="Story background"
          fill
          className={`object-cover ${
            isNarrationOnly ? 'opacity-75' : 'opacity-50'
          }`}
          unoptimized
          priority
          draggable={false}
        />
      </div>

      <DialogContent
        sequence={sequence}
        onContinue={onContinue}
        onDialogAction={onDialogAction}
        onLineChange={setCurrentLineIndex}
        dialogName={dialogName}
        initialLineIndex={initialLineIndex}
        allowSkip={true}
      />
    </div>
  );
}
