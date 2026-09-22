import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

import sharp from 'sharp';

const repoRoot = process.cwd();
const manifestDirectory = join(repoRoot, 'src', 'content', 'creatures');
const errors = [];

function fail(file, message) {
  errors.push(`${basename(file)}: ${message}`);
}

async function inspectImage(file) {
  try {
    const metadata = await sharp(file, { failOn: 'error' }).metadata();
    if (metadata.format !== 'png' && metadata.format !== 'webp') {
      return { error: 'asset must be a valid PNG or WebP' };
    }
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      hasAlpha: metadata.hasAlpha,
    };
  } catch {
    return { error: 'asset must be a valid PNG or WebP' };
  }
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
  if (
    manifest.secondaryElement !== undefined &&
    !/^[A-Z]+$/.test(manifest.secondaryElement)
  ) {
    fail(file, 'secondaryElement must be an ElementType enum key');
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

    const image = await inspectImage(assetFile);
    if (image.error) {
      fail(file, `${role} ${image.error}`);
      continue;
    }
    if (image.width !== asset.width || image.height !== asset.height) {
      fail(
        file,
        `${role} dimensions are ${image.width}x${image.height}; expected ${asset.width}x${asset.height}`
      );
    }
    if (!image.hasAlpha) {
      fail(file, `${role} ${image.format.toUpperCase()} has no alpha channel`);
    }
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
