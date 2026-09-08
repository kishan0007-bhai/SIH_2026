import { useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: ReactNode;
  children?: ReactNode;
  label?: string;
}

export function InfoTooltip({ content, label }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button
        type="button"
        className="text-slate-400 hover:text-slate-200 transition-colors"
        onClick={() => setShow(s => !s)}
        aria-label={label ?? 'More information'}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 px-3 py-2 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-xl border border-slate-700 leading-relaxed">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}

export function CalcLogicDrawer({ title, formula, factors }: { title: string; formula: string; factors?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
      >
        <Info className="w-3 h-3" /> View Calculation Logic
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 my-3">
              <code className="text-sm text-sky-300 font-mono whitespace-pre-wrap">{formula}</code>
            </div>
            {factors && <div className="text-sm text-slate-300 leading-relaxed">{factors}</div>}
            <button
              onClick={() => setOpen(false)}
              className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
