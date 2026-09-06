import { DialogLine } from "@/types/baseGame";

/**
 * Validates that all line IDs in a dialog sequence are unique.
 * Throws an error with detailed information if duplicates are found or a line ID is not found.
 *
 * @param sequence - The dialog line sequence to validate
 * @param dialogName - The name of the dialog (used in error messages)
 * @throws Error if duplicate IDs are found or requested line ID not found
 */
export function validateLineIds(
  sequence: DialogLine[],
  dialogName?: string
): void {
  const ids = sequence
    .map((line) => line.id)
    .filter((id) => id !== undefined) as string[];

  const uniqueIds = new Set(ids);

  if (ids.length !== uniqueIds.size) {
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];

    throw new Error(
      `[DialogLineValidator] Duplicate line IDs found in dialog${
        dialogName ? ` "${dialogName}"` : ""
      }: ${uniqueDuplicates.join(", ")}. All line IDs must be unique.`
    );
  }
}

/**
 * Finds the index of a line by its ID within a dialog sequence.
 * Throws an error with helpful context if the line is not found.
 *
 * @param sequence - The dialog line sequence to search
 * @param lineId - The ID of the line to find
 * @param dialogName - The name of the dialog (used in error messages)
 * @returns The index of the line in the sequence
 * @throws Error if the line ID is not found
 */
export function findLineIndexById(
  sequence: DialogLine[],
  lineId: string,
  dialogName?: string
): number {
  const index = sequence.findIndex((line) => line.id === lineId);

  if (index === -1) {
    const availableIds = sequence
      .map((line) => line.id)
      .filter((id) => id !== undefined) as string[];

    throw new Error(
      `[DialogLineValidator] Line with ID "${lineId}" not found in dialog${
        dialogName ? ` "${dialogName}"` : ""
      }. Available line IDs: ${
        availableIds.length > 0 ? availableIds.join(", ") : "none"
      }.`
    );
  }

  return index;
}
