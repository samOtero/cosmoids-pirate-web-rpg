import { describe, expect, it } from 'vitest';

import * as dialogConfigs from '@/constants/dialogs';
import {
  formatValidationErrors,
  validateDialogConfigs,
} from '@/utils/buildTimeDialogValidator';
import { DialogConfig } from '@/types/baseGame';

describe('Dialog configuration system', () => {
  it('accepts every exported dialog as a structurally valid configuration', () => {
    const result = validateDialogConfigs(
      dialogConfigs as Record<string, DialogConfig>
    );

    if (!result.valid) {
      console.error(formatValidationErrors(result));
    }

    expect(result.valid).toBe(true);
  });
});
