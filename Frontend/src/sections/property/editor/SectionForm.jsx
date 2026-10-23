import { useContext } from 'react';
import { Loader2, Save } from 'lucide-react';
import { EditorStepContext } from './editorContext';

export function SectionHeader({ title, description }) {
  const { icon: Icon } = useContext(EditorStepContext);
  return (
    <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center shrink-0 shadow-[0_4px_12px_-4px_rgba(37,99,235,0.6)]">
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-ink leading-tight">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export default function SectionForm({ title, description, onSubmit, saving, readOnly, children }) {
  const { footer } = useContext(EditorStepContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!readOnly) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="dash-card">
      <SectionHeader title={title} description={description} />
      <fieldset disabled={readOnly || saving} className="px-6 py-6 space-y-6 disabled:opacity-80">
        {children}
      </fieldset>
      {!readOnly && (
        <div className="px-6 pb-5 flex justify-end">
          <button type="submit" disabled={saving} className="btn-brand">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save {title}
          </button>
        </div>
      )}
      {footer}
    </form>
  );
}

export function FieldGroup({ title, description, children, cols = 2 }) {
  const grid = { 1: 'grid-cols-1', 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-3' }[cols];
  return (
    <div className="not-first:pt-6 not-first:border-t not-first:border-gray-100">
      {title && (
        <div className="mb-5">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      )}
      <div className={`grid ${grid} gap-x-4 gap-y-5`}>{children}</div>
    </div>
  );
}
