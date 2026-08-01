import { describe, it, expect, beforeAll } from 'vitest';
import {
  validateDialogConfig,
  formatValidationErrors,
} from '@/utils/buildTimeDialogValidator';
import {
  NEW_PLAYER_WELCOME_DIALOG,
  AFTER_STARTER_CHOICE_DIALOG,
  STARTER_BATTLE_LOSE,
  LEVEL_1_THE_MESSAGE,
  LEVEL_1_WIN,
  LEVEL_1_INTRO,
  LEVEL_2_DEPARTURE,
  LEVEL_2_STORM,
  LEVEL_2_SHIPWRECK_INTRO,
  FOUND_ITEM,
} from '@/constants/dialogs';
import { DialogConfig } from '@/types/baseGame';

describe('Dialog Configuration Integration Tests', () => {
  let allDialogs: Record<string, DialogConfig> = {};

  beforeAll(() => {
    // Collect all dialog configs for validation
    allDialogs = {
      NEW_PLAYER_WELCOME_DIALOG,
      AFTER_STARTER_CHOICE_DIALOG,
      STARTER_BATTLE_LOSE,
      LEVEL_1_THE_MESSAGE,
      LEVEL_1_WIN,
      LEVEL_1_INTRO,
      LEVEL_2_DEPARTURE,
      LEVEL_2_STORM,
      LEVEL_2_SHIPWRECK_INTRO,
      FOUND_ITEM,
    };
  });

  describe('Individual Dialog Validation', () => {
    it('should validate NEW_PLAYER_WELCOME_DIALOG', () => {
      const result = validateDialogConfig(
        NEW_PLAYER_WELCOME_DIALOG,
        'NEW_PLAYER_WELCOME_DIALOG'
      );
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it('should validate AFTER_STARTER_CHOICE_DIALOG', () => {
      const result = validateDialogConfig(
        AFTER_STARTER_CHOICE_DIALOG,
        'AFTER_STARTER_CHOICE_DIALOG'
      );
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it('should validate STARTER_BATTLE_LOSE', () => {
      const result = validateDialogConfig(
        STARTER_BATTLE_LOSE,
        'STARTER_BATTLE_LOSE'
      );
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it('should validate LEVEL_1_THE_MESSAGE', () => {
      const result = validateDialogConfig(
        LEVEL_1_THE_MESSAGE,
        'LEVEL_1_THE_MESSAGE'
      );
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it('should validate LEVEL_1_WIN', () => {
      const result = validateDialogConfig(LEVEL_1_WIN, 'LEVEL_1_WIN');
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it('should validate LEVEL_1_INTRO', () => {
      const result = validateDialogConfig(LEVEL_1_INTRO, 'LEVEL_1_INTRO');
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it('should validate LEVEL_2_DEPARTURE', () => {
      const result = validateDialogConfig(
        LEVEL_2_DEPARTURE,
        'LEVEL_2_DEPARTURE'
      );
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it('should validate LEVEL_2_STORM', () => {
      const result = validateDialogConfig(LEVEL_2_STORM, 'LEVEL_2_STORM');
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it('should validate LEVEL_2_SHIPWRECK_INTRO', () => {
      const result = validateDialogConfig(
        LEVEL_2_SHIPWRECK_INTRO,
        'LEVEL_2_SHIPWRECK_INTRO'
      );
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it('should validate FOUND_ITEM', () => {
      const result = validateDialogConfig(FOUND_ITEM, 'FOUND_ITEM');
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Dialog Sequence Validation', () => {
    it('should not have duplicate line IDs across all dialogs', () => {
      Object.entries(allDialogs).forEach(([dialogName, dialog]) => {
        const result = validateDialogConfig(dialog, dialogName);
        const duplicateErrors = result.errors.filter((e) =>
          e.error.includes('Duplicate')
        );
        if (duplicateErrors.length > 0) {
          console.error(formatValidationErrors(result));
        }
        expect(duplicateErrors).toHaveLength(0);
      });
    });

    it('should not have invalid jumpToLineId references', () => {
      Object.entries(allDialogs).forEach(([dialogName, dialog]) => {
        const result = validateDialogConfig(dialog, dialogName);
        const jumpErrors = result.errors.filter((e) =>
          e.error.includes('jumpToLineId')
        );
        if (jumpErrors.length > 0) {
          console.error(formatValidationErrors(result));
        }
        expect(jumpErrors).toHaveLength(0);
      });
    });

    it('should have valid line structure for all dialogs', () => {
      Object.entries(allDialogs).forEach(([dialogName, dialog]) => {
        const result = validateDialogConfig(dialog, dialogName);
        const structureErrors = result.errors.filter((e) =>
          e.error.includes('properties')
        );
        if (structureErrors.length > 0) {
          console.error(formatValidationErrors(result));
        }
        expect(structureErrors).toHaveLength(0);
      });
    });
  });

  describe('Error Reporting', () => {
    it('should produce no errors for all dialogs', () => {
      const allErrors: { dialog: string; error: string }[] = [];

      Object.entries(allDialogs).forEach(([dialogName, dialog]) => {
        const result = validateDialogConfig(dialog, dialogName);
        allErrors.push(...result.errors.filter((e) => e.severity === 'error'));
      });

      if (allErrors.length > 0) {
        console.error('Validation errors found in dialogs:');
        allErrors.forEach((err) => {
          console.error(`  - ${err.dialog}: ${err.error}`);
        });
      }

      expect(allErrors).toHaveLength(0);
    });
  });
});
