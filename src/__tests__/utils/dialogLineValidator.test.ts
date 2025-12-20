import { describe, it, expect } from "vitest";
import {
  validateLineIds,
  findLineIndexById,
} from "@/utils/dialogLineValidator";
import { DialogLine } from "@/types/baseGame";

describe("dialogLineValidator", () => {
  describe("validateLineIds", () => {
    it("should pass when all line IDs are unique", () => {
      const sequence: DialogLine[] = [
        {
          id: "line_1",
          portraits: [],
          speakerIndex: 0,
          text: "Hello",
        },
        {
          id: "line_2",
          portraits: [],
          speakerIndex: 0,
          text: "World",
        },
      ];

      expect(() => validateLineIds(sequence, "TestDialog")).not.toThrow();
    });

    it("should pass when no line IDs are present", () => {
      const sequence: DialogLine[] = [
        {
          portraits: [],
          speakerIndex: 0,
          text: "Hello",
        },
        {
          portraits: [],
          speakerIndex: 0,
          text: "World",
        },
      ];

      expect(() => validateLineIds(sequence, "TestDialog")).not.toThrow();
    });

    it("should throw error with duplicate line IDs", () => {
      const sequence: DialogLine[] = [
        {
          id: "duplicate_id",
          portraits: [],
          speakerIndex: 0,
          text: "Hello",
        },
        {
          id: "duplicate_id",
          portraits: [],
          speakerIndex: 0,
          text: "World",
        },
      ];

      expect(() => validateLineIds(sequence, "TestDialog")).toThrow(
        /Duplicate line IDs found.*duplicate_id/
      );
    });

    it("should include dialog name in error message when provided", () => {
      const sequence: DialogLine[] = [
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
      ];

      expect(() => validateLineIds(sequence, "MySpecialDialog")).toThrow(
        /MySpecialDialog/
      );
    });

    it("should detect multiple duplicate IDs", () => {
      const sequence: DialogLine[] = [
        {
          id: "dup1",
          portraits: [],
          speakerIndex: 0,
          text: "A",
        },
        {
          id: "dup1",
          portraits: [],
          speakerIndex: 0,
          text: "B",
        },
        {
          id: "dup2",
          portraits: [],
          speakerIndex: 0,
          text: "C",
        },
        {
          id: "dup2",
          portraits: [],
          speakerIndex: 0,
          text: "D",
        },
      ];

      expect(() => validateLineIds(sequence)).toThrow(/dup1.*dup2/);
    });
  });

  describe("findLineIndexById", () => {
    it("should find line by ID", () => {
      const sequence: DialogLine[] = [
        {
          id: "first",
          portraits: [],
          speakerIndex: 0,
          text: "Hello",
        },
        {
          id: "second",
          portraits: [],
          speakerIndex: 0,
          text: "World",
        },
        {
          id: "third",
          portraits: [],
          speakerIndex: 0,
          text: "!",
        },
      ];

      expect(findLineIndexById(sequence, "second")).toBe(1);
      expect(findLineIndexById(sequence, "third")).toBe(2);
      expect(findLineIndexById(sequence, "first")).toBe(0);
    });

    it("should throw error when line ID not found", () => {
      const sequence: DialogLine[] = [
        {
          id: "exists",
          portraits: [],
          speakerIndex: 0,
          text: "Hello",
        },
      ];

      expect(() => findLineIndexById(sequence, "doesntexist")).toThrow(
        /doesntexist/
      );
    });

    it("should include dialog name in error message", () => {
      const sequence: DialogLine[] = [
        {
          id: "exists",
          portraits: [],
          speakerIndex: 0,
          text: "Hello",
        },
      ];

      expect(() => findLineIndexById(sequence, "missing", "MyDialog")).toThrow(
        /MyDialog/
      );
    });

    it("should list available IDs in error message", () => {
      const sequence: DialogLine[] = [
        {
          id: "line_a",
          portraits: [],
          speakerIndex: 0,
          text: "A",
        },
        {
          id: "line_b",
          portraits: [],
          speakerIndex: 0,
          text: "B",
        },
      ];

      expect(() => findLineIndexById(sequence, "not_here")).toThrow(
        /line_a.*line_b/
      );
    });

    it("should show 'none' when no IDs are available", () => {
      const sequence: DialogLine[] = [
        {
          portraits: [],
          speakerIndex: 0,
          text: "No ID",
        },
      ];

      expect(() => findLineIndexById(sequence, "searching")).toThrow(/none/);
    });
  });
});
