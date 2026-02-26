import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Dev-only API route to save creature battle position & scale directly to creatures.ts.
 * POST body: { creatureVarName: string, battlePosition: { bottom: number, left: number }, battleScale: number, tdSpriteScale: number }
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
    const {
      creatureVarName,
      battlePosition,
      battleScale,
      tdSpriteScale,
      tdShadowScaleX,
      tdShadowScaleY,
      tdShadowOffsetX,
      tdShadowOffsetY,
    } = body;

    if (!creatureVarName) {
      return NextResponse.json(
        { error: 'creatureVarName is required' },
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
    // Pattern: `export const VAR_NAME: Creature = {`
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

    // Remove existing properties if present
    creatureBlock = creatureBlock.replace(
      /\s*battlePosition:\s*\{[^}]*\},?\n?/,
      '\n'
    );
    creatureBlock = creatureBlock.replace(
      /\s*tdSpriteScale:\s*[+-]?[\d.]+,?\n?/,
      '\n'
    );
    creatureBlock = creatureBlock.replace(
      /\s*tdShadowScale:\s*[+-]?[\d.]+,?\n?/,
      '\n'
    );
    creatureBlock = creatureBlock.replace(
      /\s*tdShadowScaleX:\s*[+-]?[\d.]+,?\n?/,
      '\n'
    );
    creatureBlock = creatureBlock.replace(
      /\s*tdShadowScaleY:\s*[+-]?[\d.]+,?\n?/,
      '\n'
    );
    creatureBlock = creatureBlock.replace(
      /\s*tdShadowOffsetX:\s*[+-]?[\d.]+,?\n?/,
      '\n'
    );
    creatureBlock = creatureBlock.replace(
      /\s*tdShadowOffsetY:\s*[+-]?[\d.]+,?\n?/,
      '\n'
    );

    // Clean up any double newlines from removal
    creatureBlock = creatureBlock.replace(/\n\n+/g, '\n');

    // Add new values before the closing brace
    // Ensure the last property has a trailing comma
    creatureBlock = creatureBlock.replace(/,?\s*$/, ',\n');

    if (battlePosition) {
      creatureBlock += `  battlePosition: { bottom: ${battlePosition.bottom}, left: ${battlePosition.left} },\n`;
    }
    if (battleScale !== undefined && battleScale !== 1) {
      creatureBlock += `  battleScale: ${battleScale},\n`;
    }
    if (tdSpriteScale !== undefined && tdSpriteScale !== 1) {
      creatureBlock += `  tdSpriteScale: ${tdSpriteScale},\n`;
    }
    if (tdShadowScaleX !== undefined && tdShadowScaleX !== 1) {
      creatureBlock += `  tdShadowScaleX: ${tdShadowScaleX},\n`;
    }
    if (tdShadowScaleY !== undefined && tdShadowScaleY !== 1) {
      creatureBlock += `  tdShadowScaleY: ${tdShadowScaleY},\n`;
    }
    if (tdShadowOffsetX !== undefined && tdShadowOffsetX !== 0) {
      creatureBlock += `  tdShadowOffsetX: ${tdShadowOffsetX},\n`;
    }
    if (tdShadowOffsetY !== undefined && tdShadowOffsetY !== 0) {
      creatureBlock += `  tdShadowOffsetY: ${tdShadowOffsetY},\n`;
    }

    const newBlock = match[1] + creatureBlock + match[3];
    fileContent = fileContent.replace(match[0], newBlock);

    fs.writeFileSync(creaturesFilePath, fileContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Updated ${creatureVarName}`,
    });
  } catch (error) {
    console.error('Error saving creature position:', error);
    return NextResponse.json(
      { error: 'Failed to save creature position' },
      { status: 500 }
    );
  }
}
