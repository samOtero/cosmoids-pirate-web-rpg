# Editor source saves

Level, dialogue, animation, tower-size and effect editors share one source save protocol. The authored TypeScript registries remain the source of truth; there is no second content manifest.

## Loading and saving

`useEditorSource` loads current data from the development-only `/api/dev/editor-source` endpoint with its source revision. The reader parses data syntax without executing source code. Direct imports, spreads, enums, local constants and array references are resolved from disk. Opaque expressions such as function calls retain their compiled runtime value and cannot be edited through the source patcher.

The save request includes the original data and source revision. `editorSourceService` rejects missing or stale baselines, including changes to imported data sources. It compares the draft with its baseline and patches only changed TypeScript nodes. Unchanged comments, references, spreads, imports, helper code and other exports are preserved. No-op saves leave the file unchanged.

Prettier uses the repository configuration. Changed files may have their formatting normalized once; subsequent saves use the same style. File replacements are staged and syntax-checked before writing. Editor writes are serialized, source versions are checked again before replacement, and partial multi-file failures receive best-effort rollback. These are optimistic checks, not a filesystem lock against other applications or a crash-proof multi-file transaction.

## Conflicts and shared expressions

A conflict leaves the draft open and displays the reason. Copy any changes you want to retain before choosing **Reload source**, which asks before discarding the draft. A source update never automatically replaces unsaved work.

Editing a literal nested inside a level works normally. Editing through a shared object reference or inherited array is refused with a source-edit explanation. For example, moving a point in an inherited `...FIRST_LEVEL` layout requires editing its owner in source; saving a different scalar override does not flatten the rest of that layout. Changed scalar references become explicit values because that is the value being edited.

Dialogue deletion removes the selected declaration and context enum member, keeping its module, barrel export, sibling declarations and helper code. References from other game systems still need to be updated before deleting a dialogue they use.

## Adding an editor

1. Add a fixed source target to `editorSourceService`, with content validation where applicable. Do not accept arbitrary filesystem paths from the browser.
2. Load the draft through `useEditorSource` and show `EditorSourceStatus` so source loading, writes and conflicts are visible.
3. Save through the shared hook and service. Never use `eval`, regular expressions to find declaration boundaries, or full-file JSON serialization. New entries must refuse to overwrite existing names.
4. Keep unsupported source constructs unchanged, or return an actionable error before writing. Do not silently replace them with evaluated snapshots.
5. Add behavior tests with controlled data for preservation, conflicts, repeated saves and failures. Extend registry loading checks to discover the new content automatically.

Run `pnpm verify:quick`, `pnpm test:content` and `pnpm build` after changing editor persistence. The shared regression tests run in the unit suite.
