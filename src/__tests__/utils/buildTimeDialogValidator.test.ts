import { describe, it, expect } from "vitest";
import {
  validateDialogConfig,
  validateDialogConfigs,
  formatValidationErrors,
} from "@/utils/buildTimeDialogValidator";
import {
  DialogConfig,
  BackgroundImageKey,
  Screens,
  SpeakerImageKey,
} from "@/types/baseGame";

describe("buildTimeDialogValidator", () => {
  describe("validateDialogConfig", () => {
    it("should validate a properly formed dialog", () => {
      const dialog: DialogConfig = {
        sequence: [
          {
            id: "start",
            portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
            speakerIndex: 0,
            text: "Hello",
          },
        ],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
        next: { screen: Screens.MAP },
      };

      const result = validateDialogConfig(dialog, "TestDialog");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect duplicate line IDs", () => {
      const dialog: DialogConfig = {
        sequence: [
          {
            id: "dup",
            portraits: [],
            speakerIndex: 0,
            text: "First",
          },
          {
            id: "dup",
            portraits: [],
            speakerIndex: 0,
            text: "Second",
          },
        ],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
      };

      const result = validateDialogConfig(dialog, "TestDialog");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.error.includes("Duplicate"))).toBe(
        true
      );
    });

    it("should detect invalid jumpToLineId references", () => {
      const dialog: DialogConfig = {
        sequence: [
          {
            id: "start",
            portraits: [],
            speakerIndex: 0,
            text: "Choose",
            buttons: [
              {
                label: "Go to missing",
                jumpToLineId: "doesntexist",
              },
            ],
          },
        ],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
      };

      const result = validateDialogConfig(dialog, "TestDialog");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.error.includes("doesntexist"))).toBe(
        true
      );
    });

    it("should validate valid jumpToLineId references", () => {
      const dialog: DialogConfig = {
        sequence: [
          {
            id: "start",
            portraits: [],
            speakerIndex: 0,
            text: "Choose",
            buttons: [
              {
                label: "Go to next",
                jumpToLineId: "next_line",
              },
            ],
          },
          {
            id: "next_line",
            portraits: [],
            speakerIndex: 0,
            text: "You went to the next line",
          },
        ],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
      };

      const result = validateDialogConfig(dialog, "TestDialog");
      expect(result.valid).toBe(true);
    });

    it("should detect empty sequences", () => {
      const dialog: DialogConfig = {
        sequence: [],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
      };

      const result = validateDialogConfig(dialog, "TestDialog");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.error.includes("empty"))).toBe(true);
    });

    it("should detect missing required line properties", () => {
      const dialog: DialogConfig = {
        sequence: [
          {
            // @ts-expect-error - intentionally missing properties for test
            speakerIndex: 0,
            text: "Missing portraits",
          },
        ],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
      };

      const result = validateDialogConfig(dialog, "TestDialog");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.error.includes("portraits"))).toBe(
        true
      );
    });

    it("should warn about out-of-bounds speakerIndex", () => {
      const dialog: DialogConfig = {
        sequence: [
          {
            portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
            speakerIndex: 5, // Out of bounds
            text: "Hello",
          },
        ],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
      };

      const result = validateDialogConfig(dialog, "TestDialog");
      expect(result.errors.some((e) => e.severity === "warning")).toBe(true);
      expect(result.errors.some((e) => e.error.includes("out of bounds"))).toBe(
        true
      );
    });

    it("should warn about unreachable line IDs", () => {
      const dialog: DialogConfig = {
        sequence: [
          {
            id: "start",
            portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
            speakerIndex: 0,
            text: "Start",
            buttons: [
              {
                label: "Jump to end",
                jumpToLineId: "end",
              },
            ],
          },
          {
            id: "dead_end",
            portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
            speakerIndex: 0,
            text: "Never reached because start jumps over me",
          },
          {
            id: "end",
            portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
            speakerIndex: 0,
            text: "End",
          },
        ],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
      };

      const result = validateDialogConfig(dialog, "TestDialog");
      // Since there's a button jump from start to end, dead_end is unreachable
      const hasWarning = result.errors.some(
        (e) => e.severity === "warning" && e.error.includes("dead_end")
      );
      expect(hasWarning).toBe(true);
    });

    it("should include dialog name in errors", () => {
      const dialog: DialogConfig = {
        sequence: [
          {
            id: "a",
            portraits: [],
            speakerIndex: 0,
            text: "A",
          },
          {
            id: "a",
            portraits: [],
            speakerIndex: 0,
            text: "B",
          },
        ],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
      };

      const result = validateDialogConfig(dialog, "SpecialDialog");
      expect(result.errors.every((e) => e.dialog === "SpecialDialog")).toBe(
        true
      );
    });
  });

  describe("validateDialogConfigs", () => {
    it("should validate multiple dialogs", () => {
      const dialogs: Record<string, DialogConfig> = {
        Dialog1: {
          sequence: [
            {
              id: "d1_start",
              portraits: [],
              speakerIndex: 0,
              text: "Dialog 1",
            },
          ],
          backgroundImageKey: BackgroundImageKey.DEFAULT,
        },
        Dialog2: {
          sequence: [
            {
              id: "d2_start",
              portraits: [],
              speakerIndex: 0,
              text: "Dialog 2",
            },
          ],
          backgroundImageKey: BackgroundImageKey.DEFAULT,
        },
      };

      const result = validateDialogConfigs(dialogs);
      expect(result.valid).toBe(true);
    });

    it("should report all errors from multiple dialogs", () => {
      const dialogs: Record<string, DialogConfig> = {
        BadDialog1: {
          sequence: [
            {
              id: "dup",
              portraits: [],
              speakerIndex: 0,
              text: "A",
            },
            {
              id: "dup",
              portraits: [],
              speakerIndex: 0,
              text: "B",
            },
          ],
          backgroundImageKey: BackgroundImageKey.DEFAULT,
        },
        BadDialog2: {
          sequence: [
            {
              portraits: [],
              speakerIndex: 0,
              text: "C",
              buttons: [
                {
                  label: "Bad jump",
                  jumpToLineId: "missing",
                },
              ],
            },
          ],
          backgroundImageKey: BackgroundImageKey.DEFAULT,
        },
      };

      const result = validateDialogConfigs(dialogs);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("formatValidationErrors", () => {
    it("should return success message for valid dialogs", () => {
      const result = {
        valid: true,
        errors: [],
      };

      const formatted = formatValidationErrors(result);
      expect(formatted).toContain("✅");
      expect(formatted).toContain("valid");
    });

    it("should format errors with icons and organization", () => {
      const result = {
        valid: false,
        errors: [
          {
            dialog: "TestDialog",
            error: "Duplicate line IDs found: dup",
            severity: "error" as const,
          },
          {
            dialog: "TestDialog",
            error: "Line ID unreachable",
            severity: "warning" as const,
          },
        ],
      };

      const formatted = formatValidationErrors(result);
      expect(formatted).toContain("❌");
      expect(formatted).toContain("🔴 ERROR");
      expect(formatted).toContain("🟡 WARNING");
      expect(formatted).toContain("TestDialog");
    });

    it("should count errors and warnings", () => {
      const result = {
        valid: false,
        errors: [
          {
            dialog: "D1",
            error: "Error 1",
            severity: "error" as const,
          },
          {
            dialog: "D1",
            error: "Error 2",
            severity: "error" as const,
          },
          {
            dialog: "D1",
            error: "Warning 1",
            severity: "warning" as const,
          },
        ],
      };

      const formatted = formatValidationErrors(result);
      expect(formatted).toContain("2 error");
      expect(formatted).toContain("1 warning");
    });
  });
});
