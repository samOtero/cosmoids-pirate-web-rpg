/** Public build-time switches. Features stay disabled unless explicitly enabled. */
export function isRogueliteEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ROGUELITE === 'true';
}
