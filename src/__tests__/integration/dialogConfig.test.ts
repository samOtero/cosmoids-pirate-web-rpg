import { describe, it, expect, beforeAll } from "vitest";
import {
  validateDialogConfig,
  formatValidationErrors,
} from "@/utils/buildTimeDialogValidator";
import {
  NEW_PLAYER_WELCOME_DIALOG,
  ISLAND_INTRO_DIALOGS,
  ISLAND_VICTORY_DIALOGS,
  ISLAND_DEFEAT_DIALOGS,
  EXAMPLE_DIALOG_WITH_LINE_JUMPING,
} from "@/constants/dialogs";
import { DialogConfig } from "@/types/baseGame";

describe("Dialog Configuration Integration Tests", () => {
  let allDialogs: Record<string, DialogConfig> = {};

  beforeAll(() => {
    // Collect all dialog configs for validation
    allDialogs = {
      NEW_PLAYER_WELCOME_DIALOG,
      EXAMPLE_DIALOG_WITH_LINE_JUMPING,
      ...Object.entries(ISLAND_INTRO_DIALOGS).reduce((acc, [key, dialog]) => {
        acc[`ISLAND_INTRO_DIALOGS[${key}]`] = dialog;
        return acc;
      }, {} as Record<string, DialogConfig>),
      ...Object.entries(ISLAND_VICTORY_DIALOGS).reduce((acc, [key, dialog]) => {
        acc[`ISLAND_VICTORY_DIALOGS[${key}]`] = dialog;
        return acc;
      }, {} as Record<string, DialogConfig>),
      ...Object.entries(ISLAND_DEFEAT_DIALOGS).reduce((acc, [key, dialog]) => {
        acc[`ISLAND_DEFEAT_DIALOGS[${key}]`] = dialog;
        return acc;
      }, {} as Record<string, DialogConfig>),
    };
  });

  describe("Individual Dialog Validation", () => {
    it("should validate NEW_PLAYER_WELCOME_DIALOG", () => {
      const result = validateDialogConfig(
        NEW_PLAYER_WELCOME_DIALOG,
        "NEW_PLAYER_WELCOME_DIALOG"
      );
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it("should validate EXAMPLE_DIALOG_WITH_LINE_JUMPING", () => {
      const result = validateDialogConfig(
        EXAMPLE_DIALOG_WITH_LINE_JUMPING,
        "EXAMPLE_DIALOG_WITH_LINE_JUMPING"
      );
      if (!result.valid) {
        console.error(formatValidationErrors(result));
      }
      expect(result.valid).toBe(true);
    });

    it("should validate all ISLAND_INTRO_DIALOGS", () => {
      Object.entries(ISLAND_INTRO_DIALOGS).forEach(([key, dialog]) => {
        const result = validateDialogConfig(
          dialog,
          `ISLAND_INTRO_DIALOGS[${key}]`
        );
        if (!result.valid) {
          console.error(formatValidationErrors(result));
        }
        expect(result.valid).toBe(true);
      });
    });

    it("should validate all ISLAND_VICTORY_DIALOGS", () => {
      Object.entries(ISLAND_VICTORY_DIALOGS).forEach(([key, dialog]) => {
        const result = validateDialogConfig(
          dialog,
          `ISLAND_VICTORY_DIALOGS[${key}]`
        );
        if (!result.valid) {
          console.error(formatValidationErrors(result));
        }
        expect(result.valid).toBe(true);
      });
    });

    it("should validate all ISLAND_DEFEAT_DIALOGS", () => {
      Object.entries(ISLAND_DEFEAT_DIALOGS).forEach(([key, dialog]) => {
        const result = validateDialogConfig(
          dialog,
          `ISLAND_DEFEAT_DIALOGS[${key}]`
        );
        if (!result.valid) {
          console.error(formatValidationErrors(result));
        }
        expect(result.valid).toBe(true);
      });
    });
  });

  describe("Dialog Sequence Validation", () => {
    it("should not have duplicate line IDs across all dialogs", () => {
      Object.entries(allDialogs).forEach(([dialogName, dialog]) => {
        const result = validateDialogConfig(dialog, dialogName);
        const duplicateErrors = result.errors.filter((e) =>
          e.error.includes("Duplicate")
        );
        if (duplicateErrors.length > 0) {
          console.error(formatValidationErrors(result));
        }
        expect(duplicateErrors).toHaveLength(0);
      });
    });

    it("should not have invalid jumpToLineId references", () => {
      Object.entries(allDialogs).forEach(([dialogName, dialog]) => {
        const result = validateDialogConfig(dialog, dialogName);
        const jumpErrors = result.errors.filter((e) =>
          e.error.includes("jumpToLineId")
        );
        if (jumpErrors.length > 0) {
          console.error(formatValidationErrors(result));
        }
        expect(jumpErrors).toHaveLength(0);
      });
    });

    it("should have valid line structure for all dialogs", () => {
      Object.entries(allDialogs).forEach(([dialogName, dialog]) => {
        const result = validateDialogConfig(dialog, dialogName);
        const structureErrors = result.errors.filter((e) =>
          e.error.includes("properties")
        );
        if (structureErrors.length > 0) {
          console.error(formatValidationErrors(result));
        }
        expect(structureErrors).toHaveLength(0);
      });
    });
  });

  describe("Line Jumping Behavior", () => {
    it("EXAMPLE_DIALOG_WITH_LINE_JUMPING should allow jumping between element choices", () => {
      const result = validateDialogConfig(
        EXAMPLE_DIALOG_WITH_LINE_JUMPING,
        "EXAMPLE_DIALOG_WITH_LINE_JUMPING"
      );

      // Verify all jumpToLineIds are valid
      const jumpErrors = result.errors.filter((e) =>
        e.error.includes("jumpToLineId")
      );
      expect(jumpErrors).toHaveLength(0);

      // Verify the dialog has the expected structure
      expect(EXAMPLE_DIALOG_WITH_LINE_JUMPING.sequence.length).toBeGreaterThan(
        1
      );

      const lineIds = EXAMPLE_DIALOG_WITH_LINE_JUMPING.sequence
        .map((line) => line.id)
        .filter((id) => id !== undefined);

      // Should have at least choice_start and confirmation lines
      expect(lineIds).toContain("choice_start");
      expect(lineIds.some((id) => id.includes("choice"))).toBe(true);
    });
  });

  describe("Error Reporting", () => {
    it("should produce no errors for all dialogs", () => {
      const allErrors: { dialog: string; error: string }[] = [];

      Object.entries(allDialogs).forEach(([dialogName, dialog]) => {
        const result = validateDialogConfig(dialog, dialogName);
        allErrors.push(...result.errors.filter((e) => e.severity === "error"));
      });

      if (allErrors.length > 0) {
        console.error("Validation errors found in dialogs:");
        allErrors.forEach((err) => {
          console.error(`  - ${err.dialog}: ${err.error}`);
        });
      }

      expect(allErrors).toHaveLength(0);
    });
  });
});
