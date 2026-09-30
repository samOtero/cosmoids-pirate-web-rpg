import { NextResponse } from 'next/server';
import { EditorSourceError } from './editorSourceError';

export function editorRouteError(error: unknown): NextResponse {
  console.error('Editor source operation failed:', error);
  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : 'Editor source operation failed.',
    },
    { status: error instanceof EditorSourceError ? error.status : 500 }
  );
}
