import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, '..', '..');
const repositoryRoot = path.resolve(webRoot, '..', '..');

const categories = {
  journal: {
    sourceDirectory: path.join(
      repositoryRoot,
      'art-source',
      'creatures',
      'journal',
    ),
    outputDirectory: path.join(webRoot, 'public', 'UI', 'Journal'),
    sourceExtension: '.png',
    outputExtension: '.webp',
    resize: {
      width: 1024,
      height: 1024,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    },
    webp: {
      quality: 84,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true,
    },
  },
  'story-backgrounds': {
    sourceDirectory: path.join(
      repositoryRoot,
      'art-source',
      'backgrounds',
      'story',
    ),
    outputDirectory: path.join(webRoot, 'public'),
    sourceExtension: '.png',
    outputExtension: '.webp',
    files: [
      'bg_caleb_house_1.png',
      'bg_first_town_docks_1.png',
      'bg_level_2_repaired_boat_supplies.png',
      'bg_level_2_shipwreck_beach.png',
      'bg_level_2_stormy_sea.png',
      'bg_level_2_wave_impact.png',
      'bg_level_3_sailing_away.png',
      'bg_level_4_ironbell_cell.png',
      'bg_level_4_ironbell_harbor.png',
      'bg_level_4_ironbell_market.png',
      'bg_level_4_vane_chase.png',
      'bg_level_5_ironbell_undercroft.png',
      'bg_level_5_memory_beach.png',
      'bg_level_5_memory_navy_capture.png',
      'bg_level_5_memory_razhound_attack.png',
      'bg_level_5_memory_tigrevel_rescue.png',
      'bg_level_5_tigrevel_cell.png',
      'bg_level_5_tigrevel_freed.png',
      'bg_level_5_tigrevel_protects_kids.png',
      'bg_level_6_cramped_crew_departure.png',
      'bg_level_6_net_throw.png',
      'bg_level_6_tigrevel_claims_boat.png',
      'bg_level_6_tigrevel_netted.png',
      'island_1_wip.png',
    ],
    resize: {
      width: 1920,
      height: 1080,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    },
    webp: {
      quality: 86,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true,
    },
  },
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function assertInside(parent, child) {
  const relative = path.relative(parent, child);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside ${parent}: ${child}`);
  }
}

async function optimizeCategory(categoryName) {
  const config = categories[categoryName];
  if (!config) {
    throw new Error(
      `Unknown asset category "${categoryName}". Available categories: ${Object.keys(categories).join(', ')}`,
    );
  }

  assertInside(repositoryRoot, config.sourceDirectory);
  assertInside(webRoot, config.outputDirectory);

  const directoryEntries = await readdir(config.sourceDirectory, {
    withFileTypes: true,
  });
  const availableSourceFiles = new Set(
    directoryEntries
      .filter(
        (entry) =>
          entry.isFile() &&
          path.extname(entry.name).toLowerCase() === config.sourceExtension,
      )
      .map((entry) => entry.name),
  );
  const sourceFiles = [...(config.files ?? availableSourceFiles)].sort(
    (left, right) => left.localeCompare(right),
  );

  const missingSourceFiles = sourceFiles.filter(
    (sourceFile) => !availableSourceFiles.has(sourceFile),
  );
  if (missingSourceFiles.length > 0) {
    throw new Error(
      `Missing ${categoryName} source assets: ${missingSourceFiles.join(', ')}`,
    );
  }

  if (sourceFiles.length === 0) {
    throw new Error(`No source assets found in ${config.sourceDirectory}`);
  }

  await mkdir(config.outputDirectory, { recursive: true });

  const rows = [];
  let totalSourceBytes = 0;
  let totalOutputBytes = 0;

  for (const sourceName of sourceFiles) {
    const sourcePath = path.join(config.sourceDirectory, sourceName);
    const outputName = `${path.basename(sourceName, config.sourceExtension)}${config.outputExtension}`;
    const outputPath = path.join(config.outputDirectory, outputName);
    assertInside(config.outputDirectory, outputPath);

    const sourceStats = await stat(sourcePath);
    const outputBuffer = await sharp(sourcePath, { failOn: 'error' })
      .rotate()
      .resize(config.resize)
      .webp(config.webp)
      .toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    await writeFile(outputPath, outputBuffer);

    const sourceBytes = sourceStats.size;
    const outputBytes = outputBuffer.length;
    totalSourceBytes += sourceBytes;
    totalOutputBytes += outputBytes;

    rows.push({
      file: outputName,
      dimensions: `${outputMetadata.width}x${outputMetadata.height}`,
      source: formatBytes(sourceBytes),
      output: formatBytes(outputBytes),
      saved: `${((1 - outputBytes / sourceBytes) * 100).toFixed(1)}%`,
    });
  }

  console.table(rows);
  console.log(
    `${categoryName}: ${sourceFiles.length} files, ${formatBytes(totalSourceBytes)} -> ${formatBytes(totalOutputBytes)} (${((1 - totalOutputBytes / totalSourceBytes) * 100).toFixed(1)}% smaller)`,
  );
}

const requestedCategory = process.argv[2] ?? 'journal';

optimizeCategory(requestedCategory).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
