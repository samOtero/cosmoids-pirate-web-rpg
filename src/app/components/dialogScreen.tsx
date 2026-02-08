import Image from 'next/image';
import { BACKGROUND_IMAGES } from '@/constants/game';
import { DialogLine, BackgroundImageKey, DialogAction } from '@/types/baseGame';
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

  return (
    <div className="flex flex-col h-full relative">
      {/* Background */}
      <div className="absolute inset-0 bg-black/60 z-0">
        <Image
          src={getBackgroundImage(backgroundImageKey)}
          alt="Story background"
          fill
          className="object-cover opacity-50"
          unoptimized
          priority
          draggable={false}
        />
      </div>

      <DialogContent
        sequence={sequence}
        onContinue={onContinue}
        onDialogAction={onDialogAction}
        dialogName={dialogName}
        initialLineIndex={initialLineIndex}
        allowSkip={true}
      />
    </div>
  );
}
