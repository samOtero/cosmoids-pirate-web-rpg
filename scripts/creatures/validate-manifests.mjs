import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const manifestDirectory = join(repoRoot, 'src', 'content', 'creatures');
const errors = [];

function fail(file, message) {
  errors.push(`${basename(file)}: ${message}`);
}

function inspectPng(file) {
  const bytes = readFileSync(file);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(signature)) {
    return { error: 'asset is not a valid PNG' };
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25];
  let hasTransparencyChunk = false;
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const chunkLength = bytes.readUInt32BE(offset);
    const chunkType = bytes.toString('ascii', offset + 4, offset + 8);
    if (chunkType === 'tRNS') hasTransparencyChunk = true;
    offset += chunkLength + 12;
    if (chunkType === 'IEND') break;
  }

  return {
    width,
    height,
    hasAlpha: colorType === 4 || colorType === 6 || hasTransparencyChunk,
  };
}

if (!existsSync(manifestDirectory)) {
  console.error(`Missing creature manifest directory: ${manifestDirectory}`);
  process.exit(1);
}

const manifestFiles = readdirSync(manifestDirectory)
  .filter((file) => file.endsWith('.json'))
  .map((file) => join(manifestDirectory, file));

if (manifestFiles.length === 0) {
  console.error('No creature manifests found.');
  process.exit(1);
}

const ids = new Set();

for (const file of manifestFiles) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(file, `invalid JSON (${error.message})`);
    continue;
  }

  if (manifest.schemaVersion !== 1) fail(file, 'schemaVersion must be 1');
  if (!/^[a-z][a-z0-9_]*$/.test(manifest.id ?? '')) {
    fail(file, 'id must be lowercase snake_case');
  } else if (ids.has(manifest.id)) {
    fail(file, `duplicate id ${manifest.id}`);
  } else {
    ids.add(manifest.id);
  }

  if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
    fail(file, 'name is required');
  }
  if (!/^[A-Z]+$/.test(manifest.element ?? '')) {
    fail(file, 'element must be an ElementType enum key');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.addedAt ?? '')) {
    fail(file, 'addedAt must use YYYY-MM-DD');
  }
  if (
    !Array.isArray(manifest.learnableAttacks) ||
    manifest.learnableAttacks.length === 0
  ) {
    fail(file, 'at least one learnable attack is required');
  }

  const requiredAssets = ['icon', 'left', 'up', 'down'];
  for (const role of requiredAssets) {
    const asset = manifest.assets?.[role];
    if (!asset) {
      fail(file, `missing ${role} asset`);
      continue;
    }
    if (!asset.url?.startsWith('/')) {
      fail(file, `${role} asset URL must start with /`);
      continue;
    }

    const assetFile = join(repoRoot, 'public', asset.url.replace(/^\/+/, ''));
    if (!existsSync(assetFile)) {
      fail(file, `${role} asset does not exist at ${asset.url}`);
      continue;
    }

    const png = inspectPng(assetFile);
    if (png.error) {
      fail(file, `${role} ${png.error}`);
      continue;
    }
    if (png.width !== asset.width || png.height !== asset.height) {
      fail(
        file,
        `${role} dimensions are ${png.width}x${png.height}; expected ${asset.width}x${asset.height}`
      );
    }
    if (!png.hasAlpha) fail(file, `${role} PNG has no alpha channel`);
  }

  if (!manifest.storyPlacement?.levelContext) {
    fail(file, 'storyPlacement.levelContext is required');
  }
  if (
    !Array.isArray(manifest.storyPlacement?.waves) ||
    manifest.storyPlacement.waves.length === 0
  ) {
    fail(file, 'storyPlacement.waves must contain at least one wave');
  }
}

if (errors.length > 0) {
  console.error(
    `Creature manifest validation failed:\n- ${errors.join('\n- ')}`
  );
  process.exit(1);
}

console.log(
  `Validated ${manifestFiles.length} creature manifest(s): ${[...ids].join(', ')}`
);
