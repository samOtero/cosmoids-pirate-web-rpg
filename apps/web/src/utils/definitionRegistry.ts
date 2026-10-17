/** Fail early if permanent ID assignments and an authored registry disagree. */
export function validateDefinitionRegistry(
  label: string,
  assignments: Readonly<Record<string, number>>,
  registry: Readonly<Record<number, { id: number }>>
): void {
  const assigned = new Set<number>();
  for (const [name, id] of Object.entries(assignments)) {
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new Error(label + ': invalid ID for ' + name);
    if (assigned.has(id)) throw new Error(label + ': duplicate ID ' + id);
    assigned.add(id);
    if (registry[id]?.id !== id)
      throw new Error(label + ': missing or mismatched definition ' + id);
  }
  for (const [key, definition] of Object.entries(registry)) {
    if (String(definition.id) !== key || !assigned.has(definition.id))
      throw new Error(label + ': unassigned or mismatched definition ' + key);
  }
}
