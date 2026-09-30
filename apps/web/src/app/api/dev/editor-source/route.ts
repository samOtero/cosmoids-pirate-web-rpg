import { NextRequest, NextResponse } from 'next/server';
import { editorRouteError } from '@/utils/editorSourceResponse';
import type { EditorKind } from '@/utils/editorSourceService';

// POST keeps this development-only read endpoint out of the static export.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development')
    return NextResponse.json(
      { error: 'Only available in development.' },
      { status: 403 }
    );
  try {
    const { loadEditorSource } = await import('@/utils/editorSourceService');
    const { kind, id }: { kind: EditorKind; id: string } = await req.json();
    return NextResponse.json(await loadEditorSource(kind, id), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return editorRouteError(error);
  }
}
