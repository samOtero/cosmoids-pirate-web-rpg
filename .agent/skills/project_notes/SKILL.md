---
name: Project Notes Manager
description: A skill for reading from and writing to the project-wide notes file.
---

# Project Notes Manager

This skill allows you to maintain a persistent `PROJECT_NOTES.md` file in the root of the repository. Use this file to store important information, architectural decisions, and other notes that should persist across sessions.

## Instructions

### Reading Notes

To read the current notes, use the `read_file` tool on `PROJECT_NOTES.md`.

### Adding Notes

To add a new note, use the `run_command` tool to append text to the file. Do NOT overwrite the file unless you have a specific reason to reformat it entirely.

**Command to append via PowerShell:**

```powershell
Add-Content -Path "PROJECT_NOTES.md" -Value "`n## [Date] New Note Title`nNote content here."
```

Make sure to include a newline before the header to separate it from previous content.

### Formatting

- Use Markdown for formatting.
- key entries with a header level 2 (`##`).
- Include the date in the header or as the first line of the entry.

## Example Usage

**User:** "Add a note that we decided to use Context API for state management."

**Agent Action:**

1. Check if `PROJECT_NOTES.md` exists.
2. If it does not exist, create it.
3. specific command:
   ```powershell
   Add-Content -Path "PROJECT_NOTES.md" -Value "`n## [2026-10-27] State Management Decision`nWe have decided to use the React Context API for global state management instead of Redux."
   ```

### Editing Notes

To edit an existing note (e.g., to update status, correct information, or add details to a specific section), use the `replace_file_content` tool.

1.  **Read the file first** to ensure you have the exact context and line numbers.
2.  **Use `replace_file_content`** to target the specific block of text you want to change.

**Example:**
Updating a previous note about state management.

```json
{
  "TargetFile": "PROJECT_NOTES.md",
  "TargetContent": "We have decided to use the React Context API",
  "ReplacementContent": "We have decided to use Redux Toolkit"
}
```

### Formatting

- Use Markdown for formatting.
