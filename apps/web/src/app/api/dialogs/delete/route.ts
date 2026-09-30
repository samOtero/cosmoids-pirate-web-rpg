import { NextRequest, NextResponse } from 'next/server';
import { editorRouteError } from '@/utils/editorSourceResponse';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development')
    return NextResponse.json(
      { error: 'Only available in development.' },
      { status: 403 }
    );
  try {
    const { deleteEditorDialog } = await import('@/utils/editorSourceService');
    const { dialogKey, source } = await req.json();
    return NextResponse.json(await deleteEditorDialog(dialogKey, source));
  } catch (error) {
    return editorRouteError(error);
  }
}
