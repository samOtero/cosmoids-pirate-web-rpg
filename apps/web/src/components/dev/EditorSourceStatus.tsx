'use client';

interface Props {
  onClose: () => void;
  source: {
    ready: boolean;
    saving: boolean;
    error: string;
    reload: () => void;
  };
}

export default function EditorSourceStatus({ source, onClose }: Props) {
  if (source.ready && !source.error && !source.saving) return null;
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[10001] flex items-center justify-center gap-4 bg-slate-950 p-4 text-white ${!source.ready || source.saving ? 'inset-y-0 bg-slate-950/95' : ''}`}
      role="status"
    >
      <span>
        {source.error || (source.saving ? 'Saving…' : 'Loading source…')}
      </span>
      {source.error && (
        <button
          type="button"
          onClick={source.reload}
          className="rounded bg-cyan-700 px-3 py-2"
        >
          Reload source
        </button>
      )}
      {!source.ready && (
        <button
          type="button"
          onClick={onClose}
          className="rounded bg-slate-700 px-3 py-2"
        >
          Close editor
        </button>
      )}
    </div>
  );
}
