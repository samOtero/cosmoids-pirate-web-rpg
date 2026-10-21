import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

// Compile the authored registries; never maintain a second gameplay manifest.
await build({
  entryPoints: [
    fileURLToPath(new URL('./game-content-entry.ts', import.meta.url)),
  ],
  outfile: fileURLToPath(
    new URL('../dist/authored-game-content.js', import.meta.url)
  ),
  tsconfig: fileURLToPath(new URL('../../web/tsconfig.json', import.meta.url)),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
});

if (process.argv.includes('--tests')) {
  await build({
    entryPoints: [
      fileURLToPath(
        new URL(
          '../../web/src/__tests__/utils/dataBuilders.ts',
          import.meta.url
        )
      ),
    ],
    outfile: fileURLToPath(
      new URL('../tests/.generated/data-builders.mjs', import.meta.url)
    ),
    tsconfig: fileURLToPath(
      new URL('../../web/tsconfig.json', import.meta.url)
    ),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
  });
}
