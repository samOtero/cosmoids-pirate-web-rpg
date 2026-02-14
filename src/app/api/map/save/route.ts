import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Island } from '@/types/baseGame';

export async function POST(req: NextRequest) {
  try {
    const { islands }: { islands: Island[] } = await req.json();

    if (!islands) {
      return NextResponse.json(
        { error: 'Missing islands data' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'src', 'constants', 'islands.ts');

    // We use 'as any' to avoid TypeScript errors with string enums in JSON
    const fileContent = `import {
  Island,
  BackgroundImageKey,
  BattleContext,
} from '@/types/baseGame';

export const ISLANDS: Island[] = ${JSON.stringify(islands, null, 2)} as any;
`;

    await fs.writeFile(filePath, fileContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving islands:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
