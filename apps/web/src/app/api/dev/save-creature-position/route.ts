import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Dev-only API route to save creature tdConfig directly to tdConfigs.ts
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { creatureId, tdConfig } = body;

    if (!creatureId) {
      return NextResponse.json(
        { error: 'creatureId is required' },
        { status: 400 }
      );
    }

    if (!tdConfig) {
      return NextResponse.json(
        { error: 'tdConfig is required' },
        { status: 400 }
      );
    }

    const configsFilePath = path.join(
      process.cwd(),
      'src',
      'constants',
      'tdConfigs.ts'
    );
    let fileContent = fs.readFileSync(configsFilePath, 'utf-8');

    // Extract the object part
    const exportIndex = fileContent.indexOf('CREATURE_TD_CONFIGS');
    const objStart = fileContent.indexOf('{', exportIndex);
    const objEnd = fileContent.lastIndexOf('}');

    if (objStart === -1 || objEnd === -1) {
      return NextResponse.json(
        { error: 'Could not parse tdConfigs.ts' },
        { status: 500 }
      );
    }

    // Since it's a dev tool, we evaluate the object string to modify it
    // Note: evaluating code from the file we just read, which is safe locally
    const objStr = fileContent.substring(objStart, objEnd + 1);

    // Evaluate safely by wrapping in parentheses
    let configsObject;
    try {
      configsObject = eval('(' + objStr + ')');
    } catch (e) {
      console.error('Eval error:', e);
      return NextResponse.json(
        { error: 'Failed to evaluate tdConfigs.ts' },
        { status: 500 }
      );
    }

    // Update the specific creature's config
    configsObject[creatureId] = tdConfig;

    // Format new JSON string
    let formattedJson = JSON.stringify(configsObject, null, 2);
    // Remove quotes from known simple property keys to look like standard JS
    formattedJson = formattedJson.replace(/"([^"]+)":/g, '$1:');

    // Reconstruct the file content
    const newFileContent = `import { UnitVisuals } from '@/types/baseGame';

export const CREATURE_TD_CONFIGS: Record<string, UnitVisuals> = ${formattedJson};
`;

    fs.writeFileSync(configsFilePath, newFileContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Updated tdConfig for ${creatureId}`,
    });
  } catch (error) {
    console.error('Error saving creature tdConfig:', error);
    return NextResponse.json(
      { error: 'Failed to save creature tdConfig' },
      { status: 500 }
    );
  }
}
