import { DialogConfig } from "@/types/baseGame";

export interface DialogValidationError {
  dialog: string;
  error: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: DialogValidationError[];
}

/**
 * Comprehensive build-time validator for dialog configurations.
 * Checks for common issues before deployment.
 *
 * Validates:
 * - Duplicate line IDs within each dialog
 * - Invalid jumpToLineId references (target doesn't exist)
 * - Missing required properties
 * - Malformed dialog structures
 * - Orphaned line IDs (unreachable from start)
 */

/**
 * Validates a single dialog configuration for structural and reference issues.
 *
 * @param dialog - The dialog configuration to validate
 * @param dialogName - The name/key of the dialog (for error reporting)
 * @returns Validation result with detailed error information
 */
export function validateDialogConfig(
  dialog: DialogConfig,
  dialogName: string
): ValidationResult {
  const errors: DialogValidationError[] = [];

  // Check basic structure
  if (!dialog.sequence || !Array.isArray(dialog.sequence)) {
    errors.push({
      dialog: dialogName,
      error: "Dialog must have a 'sequence' property that is an array",
      severity: "error",
    });
    return { valid: false, errors };
  }

  if (dialog.sequence.length === 0) {
    errors.push({
      dialog: dialogName,
      error: "Dialog sequence cannot be empty",
      severity: "error",
    });
    return { valid: false, errors };
  }

  // Check for duplicate line IDs
  const lineIds = dialog.sequence
    .map((line) => line.id)
    .filter((id) => id !== undefined) as string[];

  const uniqueIds = new Set(lineIds);
  if (lineIds.length !== uniqueIds.size) {
    const duplicates = lineIds.filter(
      (id, index) => lineIds.indexOf(id) !== index
    );
    const uniqueDuplicates = [...new Set(duplicates)];

    errors.push({
      dialog: dialogName,
      error: `Duplicate line IDs found: ${uniqueDuplicates.join(
        ", "
      )}. All line IDs must be unique within a dialog.`,
      severity: "error",
    });
  }

  // Create a map of available line IDs for quick lookup
  const lineIdMap = new Map<string, number>();
  dialog.sequence.forEach((line, index) => {
    if (line.id) {
      lineIdMap.set(line.id, index);
    }
  });

  // Check for invalid jumpToLineId references
  dialog.sequence.forEach((line, lineIndex) => {
    if (line.buttons && Array.isArray(line.buttons)) {
      line.buttons.forEach((button, buttonIndex) => {
        if (button.jumpToLineId) {
          if (!lineIdMap.has(button.jumpToLineId)) {
            const availableIds = Array.from(lineIdMap.keys());
            errors.push({
              dialog: dialogName,
              error: `Line ${lineIndex}, Button ${buttonIndex}: jumpToLineId "${
                button.jumpToLineId
              }" not found. Available IDs: ${
                availableIds.length > 0 ? availableIds.join(", ") : "none"
              }`,
              severity: "error",
            });
          }
        }
      });
    }
  });

  // Check for missing required properties in lines
  dialog.sequence.forEach((line, index) => {
    if (!line.portraits || !Array.isArray(line.portraits)) {
      errors.push({
        dialog: dialogName,
        error: `Line ${index}: Missing or invalid 'portraits' property`,
        severity: "error",
      });
    }

    if (!line.text || typeof line.text !== "string") {
      errors.push({
        dialog: dialogName,
        error: `Line ${index}: Missing or invalid 'text' property`,
        severity: "error",
      });
    }


  });

  // Check for orphaned line IDs (unreachable lines)
  // This is a simple heuristic: lines are reachable if they're:
  // 1. The first line, OR
  // 2. After a reachable line without buttons, OR
  // 3. Referenced by a jumpToLineId button
  // Note: Complex flow analysis isn't needed for most dialogs
  const reachableIds = new Set<string>();

  // First line is always reachable
  if (dialog.sequence[0].id) {
    reachableIds.add(dialog.sequence[0].id);
  }

  // Lines are reachable if they naturally follow a non-button line
  for (let i = 0; i < dialog.sequence.length - 1; i++) {
    const currentLine = dialog.sequence[i];
    const nextLine = dialog.sequence[i + 1];

    // If current line is reachable and has NO buttons, next line is reachable by continuation
    if (
      (i === 0 || reachableIds.has(currentLine.id || "")) &&
      (!currentLine.buttons || currentLine.buttons.length === 0)
    ) {
      if (nextLine.id) {
        reachableIds.add(nextLine.id);
      }
    }
  }

  // Check which IDs are referenced by buttons (these are also reachable)
  dialog.sequence.forEach((line) => {
    if (line.buttons) {
      line.buttons.forEach((button) => {
        if (button.jumpToLineId) {
          reachableIds.add(button.jumpToLineId);
        }
      });
    }
  });

  // Warn about unreachable IDs (optional, since it's a best-effort check)
  lineIds.forEach((id) => {
    if (!reachableIds.has(id) && id !== dialog.sequence[0].id) {
      errors.push({
        dialog: dialogName,
        error: `Line ID "${id}" may be unreachable. Verify the dialog logic manually if this isn't intentional.`,
        severity: "warning",
      });
    }
  });

  return {
    valid: errors.filter((e) => e.severity === "error").length === 0,
    errors,
  };
}

/**
 * Validates multiple dialog configurations.
 *
 * @param dialogs - Object mapping dialog names to configurations
 * @returns Combined validation result
 */
export function validateDialogConfigs(
  dialogs: Record<string, DialogConfig>
): ValidationResult {
  const allErrors: DialogValidationError[] = [];
  let hasErrors = false;

  Object.entries(dialogs).forEach(([dialogName, config]) => {
    const result = validateDialogConfig(config, dialogName);
    allErrors.push(...result.errors);
    if (!result.valid) {
      hasErrors = true;
    }
  });

  return {
    valid: !hasErrors,
    errors: allErrors,
  };
}

/**
 * Formats validation errors for console output.
 *
 * @param result - The validation result to format
 * @returns Formatted error message string
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) {
    return "✅ All dialogs are valid!";
  }

  const errorsByDialog: Record<string, DialogValidationError[]> = {};

  result.errors.forEach((error) => {
    if (!errorsByDialog[error.dialog]) {
      errorsByDialog[error.dialog] = [];
    }
    errorsByDialog[error.dialog].push(error);
  });

  let output = "\n❌ Dialog validation failed:\n";
  output += "=" + "=".repeat(79) + "\n";

  Object.entries(errorsByDialog).forEach(([dialog, errors]) => {
    output += `\n📋 Dialog: ${dialog}\n`;
    output += "-".repeat(80) + "\n";

    errors.forEach((error) => {
      const icon = error.severity === "error" ? "🔴 ERROR" : "🟡 WARNING";
      output += `  ${icon}: ${error.error}\n`;
    });
  });

  output += "\n" + "=".repeat(80) + "\n";

  const errorCount = result.errors.filter((e) => e.severity === "error").length;
  const warningCount = result.errors.filter(
    (e) => e.severity === "warning"
  ).length;

  if (errorCount > 0) {
    output += `❌ ${errorCount} error(s)`;
    if (warningCount > 0) output += `, ${warningCount} warning(s)`;
    output += "\n";
  } else if (warningCount > 0) {
    output += `⚠️  ${warningCount} warning(s)\n`;
  }

  return output;
}
