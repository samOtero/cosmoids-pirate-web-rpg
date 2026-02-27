import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { CutsceneData } from '@/types/cutscene';

export async function POST(req: NextRequest) {
  try {
    const { fileName, cutsceneName, data } = await req.json();

    if (!cutsceneName || !data) {
      return NextResponse.json(
        { error: 'Missing required fields (cutsceneName, data)' },
        { status: 400 }
      );
    }

    const cutscenesDir = path.join(
      process.cwd(),
      'src',
      'constants',
      'cutscenes'
    );
    const indexPath = path.join(
      process.cwd(),
      'src',
      'constants',
      'cutscenes',
      'index.ts'
    );

    // Create directories if they don't exist
    await fs.mkdir(cutscenesDir, { recursive: true });

    let targetFileName = fileName;

    if (!targetFileName || targetFileName === cutsceneName) {
      try {
        const files = await fs.readdir(cutscenesDir);
        for (const file of files) {
          if (file === 'index.ts') continue;
          const filePath = path.join(cutscenesDir, file);
          const content = await fs.readFile(filePath, 'utf-8');

          if (
            content.includes(`export const ${cutsceneName}:`) ||
            content.includes(`export const ${cutsceneName} =`)
          ) {
            targetFileName = file.replace(/\.ts$/, '');
            break;
          }
        }
      } catch (err) {
        console.error('Error finding existing cutscene file:', err);
      }
    }

    if (!targetFileName) {
      targetFileName = cutsceneName; // Fallback to using the exported variable name as filename
    }

    if (!targetFileName) {
      return NextResponse.json(
        { error: 'Filename not provided.' },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedFileName = targetFileName.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(cutscenesDir, `${sanitizedFileName}.ts`);

    // Format JSON
    const jsonString = JSON.stringify(data, null, 2);
    const newExportStr = `export const ${cutsceneName}: CutsceneData = ${jsonString};`;

    let fileContent = '';

    try {
      fileContent = await fs.readFile(filePath, 'utf-8');

      const exportStartMarker = `export const ${cutsceneName}`;

      if (fileContent.includes(exportStartMarker)) {
        // Find existing export and replace
        const looseRegex = new RegExp(
          `export const ${cutsceneName}[\\s\\S]*?(?=(export const|$))`
        );
        fileContent = fileContent.replace(looseRegex, newExportStr + '\n\n');
      } else {
        // Append
        fileContent += `\n\n${newExportStr}`;
      }
    } catch (e) {
      // File doesn't exist, create fresh
      fileContent = `import { CutsceneData } from "@/types/cutscene";\n\n${newExportStr}\n`;
    }

    // Write back to file
    await fs.writeFile(filePath, fileContent, 'utf-8');

    // Ensure the index file exports this
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const exportStatement = `export * from './${sanitizedFileName}';`;

      if (!indexContent.includes(exportStatement)) {
        await fs.appendFile(indexPath, `\n${exportStatement}`);
      }
    } catch (e) {
      // create index if not exist
      await fs.writeFile(
        indexPath,
        `export * from './${sanitizedFileName}';\n`,
        'utf-8'
      );
    }

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving cutscene:', error);
    return NextResponse.json(
      { error: 'Failed to save cutscene data' },
      { status: 500 }
    );
  }
}
