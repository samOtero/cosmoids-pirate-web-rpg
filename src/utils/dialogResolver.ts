import {
  DialogContext,
  BackgroundImageKey,
  DialogConfig,
  Screens,
  DialogContextData,
} from '@/types/baseGame';
import * as AllDialogs from '@/constants/dialogs';

function getDefaultDialog(): DialogConfig {
  return {
    sequence: [],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MODE_SELECT,
    },
  };
}

export function resolveDialog(
  context: DialogContext | null,
  contextData: DialogContextData | null
): DialogConfig {
  // 3. Dynamic Lookup
  // Attempts to find a dialog export matching the Context key
  // This supports new dialogs added via the editor where ContextKey matches ExportName
  if (context && context in AllDialogs) {
    return (AllDialogs as any)[context] as DialogConfig;
  }

  return getDefaultDialog();
}
