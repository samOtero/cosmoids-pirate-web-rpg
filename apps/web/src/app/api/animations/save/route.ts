import { NextRequest, NextResponse } from 'next/server';
import { editorRouteError } from '@/utils/editorSourceResponse';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development')
    return NextResponse.json(
      { error: 'Only available in development.' },
      { status: 403 }
    );
  try {
    const { saveEditorSource } = await import('@/utils/editorSourceService');
    const { animations, source } = await req.json();
    return NextResponse.json(
      await saveEditorSource('animations', 'ANIMATIONS', animations, source)
    );
  } catch (error) {
    return editorRouteError(error);
  }
}
