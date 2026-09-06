---
name: Project Notes Manager
description: A skill for reading from and writing to the project-wide notes file.
---

# Project Notes Manager

This skill allows you to maintain a persistent `PROJECT_NOTES.md` file in the root of the repository. Use this file to store important architectural decisions, design patterns, coding conventions, and tricky engineering quirks/gotchas that persist across sessions.

> [!IMPORTANT]
> Do NOT use `PROJECT_NOTES.md` as a simple chronological log for routine tasks completed. Only update this file when you discover or introduce a major architectural convention, a complex engineering quirk/gotcha, or a critical data schema change.

---

## Instructions

### Reading Notes

To read the current notes, use the `read_file` tool on `PROJECT_NOTES.md`.

### Modifying Notes

When adding new conventions, quirks, or roadmap items:
1. **Locate the correct section**:
   - `## 🛠️ Core Architecture & Tech Stack`
   - `## 🎨 Key Coding Conventions & Standards`
   - `## ⚠️ Key Engineering Quirks & Gotchas`
   - `## 🔮 Roadmap Ideas & Features (TODO / Pending)`
2. **Use `replace_file_content`** to insert or update the information in the appropriate section. Do not simply append date-based entries to the end of the file unless updating the major migration log at the bottom.

### Formatting Guidelines

- Use clear, concise Markdown bullet points and headers.
- Provide links to referenced files (e.g. `[globals.css](file:///c:/Projects/2026/cosmoids_web/apps/web/src/app/globals.css)`).
- When documenting quirks or code implementations, explain *why* it was done that way (e.g., event propagation workarounds, type compatibility shims).
