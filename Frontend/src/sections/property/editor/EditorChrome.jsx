import { Crown, Check } from 'lucide-react';

/**
 * Pieces shared by the property and development editors.
 * Steps: { key, label, description, icon, state, disabled, required }
 * where state is 'complete' | 'incomplete' | 'pending' | 'locked'.
 */

const TONES = {
  red: 'bg-red-50 border-red-200 text-red-800',
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  gray: 'bg-white border-gray-200 text-gray-700',
};

export function Banner({ tone, icon: Icon, title, children }) {
  return (
    <div className={`border rounded-xl px-4 py-3 flex gap-3 ${TONES[tone]}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="text-sm">
        <div className="font-semibold">{title}</div>
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}

const STATE_CHIPS = {
  complete: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200' },
  incomplete: { label: 'Needs info', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending: { label: 'Pending', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  locked: { label: 'Premium', className: 'bg-gray-50 text-gray-400 border-gray-200' },
};

export function Stepper({ steps, activeKey, onSelect }) {
  return (
    <div className="dash-card px-4 py-5 overflow-x-auto">
      <ol className={`flex ${steps.length > 6 ? 'min-w-[880px]' : 'min-w-[560px]'}`}>
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.key === activeKey;
          const done = step.state === 'complete';
          return (
            <li key={step.key} className="flex-1 relative">
              {i < steps.length - 1 && (
                <span className={`absolute top-[18px] left-1/2 w-full h-0.5 ${done ? 'bg-brand-400' : 'bg-gray-200'}`} />
              )}
              <button
                type="button"
                onClick={() => onSelect(step.key)}
                disabled={step.disabled}
                title={step.disabled ? 'Save General Details first' : undefined}
                className="relative w-full flex flex-col items-center text-center px-1 group disabled:cursor-not-allowed"
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white ring-4 ring-brand-100 shadow-md'
                      : done
                        ? 'bg-brand-500 text-white'
                        : step.state === 'incomplete'
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-gray-100 text-gray-400 group-enabled:group-hover:bg-gray-200'
                  }`}
                >
                  {done && !isActive ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-4 h-4" />}
                </span>
                <span className={`mt-2 text-[11px] font-semibold leading-tight ${isActive ? 'text-ink' : 'text-gray-500'}`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-gray-400 leading-tight mt-0.5">{step.description}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ProgressSummary({ steps, activeKey, onSelect }) {
  return (
    <div className="dash-card p-6">
      <h2 className="text-lg font-bold text-ink mb-4">Progress Summary</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const chip = STATE_CHIPS[step.state];
          return (
            <button
              key={step.key}
              type="button"
              disabled={step.disabled}
              onClick={() => onSelect(step.key)}
              className={`text-left rounded-xl border p-3 transition-colors disabled:cursor-not-allowed ${
                step.key === activeKey ? 'border-brand-400 bg-brand-50/60' : 'border-gray-200 bg-white hover:border-brand-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-sm font-medium text-ink truncate">{step.label}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${chip.className}`}>
                  {step.state === 'locked' && <Crown className="w-3 h-3" />}
                  {chip.label}
                </span>
                {step.required && <span className="text-[10px] uppercase tracking-wide text-gray-400">Required</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
