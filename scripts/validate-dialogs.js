#!/usr/bin/env node

/**
 * Build-time dialog validation script
 * Runs before the Next.js build to catch dialog configuration issues early
 *
 * Usage: node scripts/validate-dialogs.js
 *
 * Exit codes:
 * - 0: All dialogs valid
 * - 1: Errors found in dialogs (build will fail)
 * - 2: Script execution error
 */

// Import after checking Node version
let validateDialogConfigs, formatValidationErrors;

try {
  // Import the validator - using dynamic import for ESM compatibility
  const validatorModule = await import(
    "../dist/utils/buildTimeDialogValidator.js"
  );
  validateDialogConfigs = validatorModule.validateDialogConfigs;
  formatValidationErrors = validatorModule.formatValidationErrors;

  // Import all dialogs
  const dialogsModule = await import("../dist/constants/dialogs.js");

  const dialogs = {
    STARTER_CRAB_DIALOG: dialogsModule.STARTER_CRAB_DIALOG,
    STARTER_IGUANA_DIALOG: dialogsModule.STARTER_IGUANA_DIALOG,
    STARTER_MONKEY_DIALOG: dialogsModule.STARTER_MONKEY_DIALOG,
    NEW_PLAYER_WELCOME_DIALOG: dialogsModule.NEW_PLAYER_WELCOME_DIALOG,
    NEW_PLAYER_WELCOME_DIALOG_PART_2:
      dialogsModule.NEW_PLAYER_WELCOME_DIALOG_PART_2,
    EXAMPLE_DIALOG_WITH_LINE_JUMPING:
      dialogsModule.EXAMPLE_DIALOG_WITH_LINE_JUMPING,
    ...Object.entries(dialogsModule.ISLAND_INTRO_DIALOGS).reduce(
      (acc, [key, dialog]) => {
        acc[`ISLAND_INTRO_DIALOGS[${key}]`] = dialog;
        return acc;
      },
      {}
    ),
    ...Object.entries(dialogsModule.ISLAND_VICTORY_DIALOGS).reduce(
      (acc, [key, dialog]) => {
        acc[`ISLAND_VICTORY_DIALOGS[${key}]`] = dialog;
        return acc;
      },
      {}
    ),
    ...Object.entries(dialogsModule.ISLAND_DEFEAT_DIALOGS).reduce(
      (acc, [key, dialog]) => {
        acc[`ISLAND_DEFEAT_DIALOGS[${key}]`] = dialog;
        return acc;
      },
      {}
    ),
  };

  console.log("🔍 Validating dialog configurations...\n");

  const result = validateDialogConfigs(dialogs);
  const formatted = formatValidationErrors(result);

  console.log(formatted);

  if (!result.valid) {
    process.exit(1);
  }

  process.exit(0);
} catch (error) {
  console.error(
    "❌ Error running dialog validation script:",
    error instanceof Error ? error.message : error
  );
  console.error(
    "\n💡 Note: Make sure to build the project first (pnpm build) before running this script"
  );
  process.exit(2);
}
