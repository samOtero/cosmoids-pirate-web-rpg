import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TDLevelData } from '@/engine/tower-defense/types';

export async function POST(req: NextRequest) {
  try {
    const { fileName, levelName, config } = await req.json();

    if (!levelName || !config) {
      return NextResponse.json(
        { error: 'Missing required fields (levelName, config)' },
        { status: 400 }
      );
    }

    const levelsDir = path.join(process.cwd(), 'src', 'constants', 'tdLevels');
    const indexPath = path.join(
      process.cwd(),
      'src',
      'constants',
      'tdLevels.ts'
    );

    let targetFileName = fileName;

    if (!targetFileName || targetFileName === levelName) {
      try {
        const files = await fs.readdir(levelsDir);
        for (const file of files) {
          const filePath = path.join(levelsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');

          if (
            content.includes(`export const ${levelName}:`) ||
            content.includes(`export const ${levelName} =`)
          ) {
            targetFileName = file.replace(/\.ts$/, '');
            break;
          }
        }
      } catch (err) {
        console.error('Error finding existing level file:', err);
      }
    }

    if (!targetFileName) {
      targetFileName = levelName; // Fallback to using the exported variable name as filename
    }

    if (!targetFileName) {
      return NextResponse.json(
        { error: 'Filename not provided.' },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedFileName = targetFileName.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(levelsDir, `${sanitizedFileName}.ts`);

    // Format JSON
    const jsonString = JSON.stringify(config, null, 2);
    const newExportStr = `export const ${levelName}: TDLevelData = ${jsonString};`;

    let fileContent = '';

    try {
      fileContent = await fs.readFile(filePath, 'utf-8');

      const exportStartMarker = `export const ${levelName}`;

      if (fileContent.includes(exportStartMarker)) {
        // Find existing export and replace
        const looseRegex = new RegExp(
          `export const ${levelName}[\\s\\S]*?(?=(export const|$))`
        );
        fileContent = fileContent.replace(looseRegex, newExportStr + '\n\n');
      } else {
        // Append
        fileContent += `\n\n${newExportStr}`;
      }
    } catch (e) {
      // File doesn't exist, create fresh
      fileContent = `import { TDLevelData } from "@/engine/tower-defense/types";\n\n${newExportStr}\n`;
    }

    // Write back to file
    await fs.writeFile(filePath, fileContent, 'utf-8');

    // Ensure the index file exports this
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const exportStatement = `export * from './tdLevels/${sanitizedFileName}';`;

      if (!indexContent.includes(exportStatement)) {
        await fs.appendFile(indexPath, `\n${exportStatement}`);
      }
    } catch (e) {
      // create index if not exist
      await fs.writeFile(
        indexPath,
        `export * from './tdLevels/${sanitizedFileName}';\n`,
        'utf-8'
      );
    }

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving level:', error);
    return NextResponse.json(
      { error: 'Failed to save level data' },
      { status: 500 }
    );
  }
}
