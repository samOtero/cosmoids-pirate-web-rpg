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
    const { dialogName, fileName, config, source } = await req.json();
    return NextResponse.json(
      await saveEditorSource('dialog', dialogName, config, source, fileName)
    );
  } catch (error) {
    return editorRouteError(error);
  }
}
