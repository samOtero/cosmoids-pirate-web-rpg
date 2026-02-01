import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { AnimationMap } from '@/types/animation';

export async function POST(req: NextRequest) {
  try {
    const { animations }: { animations: AnimationMap } = await req.json();

    if (!animations) {
      return NextResponse.json(
        { error: 'Missing animations data' },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      'src',
      'constants',
      'animations.ts'
    );

    const fileContent = `import { AnimationMap } from '@/types/animation';

export const ANIMATIONS: AnimationMap = ${JSON.stringify(animations, null, 2)};
`;

    await fs.writeFile(filePath, fileContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving animations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
