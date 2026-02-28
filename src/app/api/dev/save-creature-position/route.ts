import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function removeTdConfig(content: string) {
  const startIndex = content.indexOf('tdConfig:');
  if (startIndex === -1) return content;

  let braceCount = 0;
  let inString = false;
  let endIndex = -1;
  let startedBrace = false;

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    if (char === "'" || char === '"' || char === '`') {
      if (!inString) inString = true;
      else if (content[i - 1] !== '\\') inString = false;
    }
    if (!inString) {
      if (char === '{') {
        braceCount++;
        startedBrace = true;
      }
      if (char === '}') {
        braceCount--;
      }
    }
    if (startedBrace && braceCount === 0) {
      // Find following comma if any
      let nextChar = i + 1;
      while (nextChar < content.length && /\\s/.test(content[nextChar]))
        nextChar++;
      if (content[nextChar] === ',') nextChar++;
      endIndex = nextChar;
      break;
    }
  }

  if (endIndex !== -1) {
    return content.substring(0, startIndex) + content.substring(endIndex);
  }
  return content;
}

/**
 * Dev-only API route to save creature tdConfig directly to creatures.ts.
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
    const { creatureVarName, tdConfig } = body;

    if (!creatureVarName) {
      return NextResponse.json(
        { error: 'creatureVarName is required' },
        { status: 400 }
      );
    }

    if (!tdConfig) {
      return NextResponse.json(
        { error: 'tdConfig is required' },
        { status: 400 }
      );
    }

    const creaturesFilePath = path.join(
      process.cwd(),
      'src',
      'constants',
      'creatures.ts'
    );
    let fileContent = fs.readFileSync(creaturesFilePath, 'utf-8');

    // Find the creature constant block by variable name
    const creaturePattern = new RegExp(
      `(export const ${creatureVarName}:\\s*Creature\\s*=\\s*\\{)([\\s\\S]*?)(\\};)`,
      'm'
    );

    const match = fileContent.match(creaturePattern);
    if (!match) {
      return NextResponse.json(
        {
          error: `Creature variable "${creatureVarName}" not found in creatures.ts`,
        },
        { status: 404 }
      );
    }

    let creatureBlock = match[2];

    // Remove existing tdConfig block
    creatureBlock = removeTdConfig(creatureBlock);

    // Clean up any double newlines from removal
    creatureBlock = creatureBlock.replace(/\n\n+/g, '\n');
    creatureBlock = creatureBlock.replace(/,?\s*$/, ',\n');

    // Format the new tdConfig
    let formattedJson = JSON.stringify(tdConfig, null, 2);
    // Remove quotes from known simple property keys
    formattedJson = formattedJson.replace(/"([^"]+)":/g, '$1:');

    // Indent everything inside to match standard prettier format (add 2 spaces)
    const indentedJson = formattedJson
      .split('\n')
      .map((line, idx) => (idx === 0 ? line : '  ' + line))
      .join('\n');

    creatureBlock += `  tdConfig: ${indentedJson},\n`;

    const newBlock = match[1] + creatureBlock + match[3];
    fileContent = fileContent.replace(match[0], newBlock);

    fs.writeFileSync(creaturesFilePath, fileContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Updated ${creatureVarName}`,
    });
  } catch (error) {
    console.error('Error saving creature tdConfig:', error);
    return NextResponse.json(
      { error: 'Failed to save creature tdConfig' },
      { status: 500 }
    );
  }
}
