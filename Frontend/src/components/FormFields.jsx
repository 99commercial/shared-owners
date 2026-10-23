import { labelize } from '../data/propertyOptions';
import Dropdown from './Dropdown';

const toOptions = (options) =>
  options.map((o) => (typeof o === 'object' ? o : { value: o, label: labelize(o) }));

/**
 * Outlined field with the label sitting on the top border.
 * `icon` adds a leading icon inside the input; `floating={false}` puts the label above
 * (for non-input children such as chip groups).
 */
export function Field({ label, required, hint, icon: Icon, floating = true, children, className = '' }) {
  const labelText = label && (
    <>
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </>
  );

  if (!floating) {
    return (
      <div className={className}>
        {label && <div className="text-sm font-medium text-gray-700 mb-2">{labelText}</div>}
        {children}
        {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`relative ${Icon ? 'has-icon' : ''}`}>
        {label && (
          <label className="absolute -top-2 left-2.5 z-10 px-1 bg-white text-[11px] font-medium text-gray-500 leading-4 pointer-events-none">
            {labelText}
          </label>
        )}
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none z-10" />}
        {children}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function TextInput({ value, onChange, className = '', ...props }) {
  return (
    <input
      {...props}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`dash-input ${className}`}
    />
  );
}

export function NumberInput({ value, onChange, ...props }) {
  return (
    <input
      type="number"
      {...props}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="dash-input"
    />
  );
}

export function TextArea({ value, onChange, rows = 4, ...props }) {
  return (
    <textarea
      {...props}
      rows={rows}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="dash-input resize-y"
    />
  );
}

export function SelectInput({ value, onChange, options, placeholder = 'Select…', ...props }) {
  return (
    <Dropdown
      {...props}
      variant="field"
      value={value}
      onChange={onChange}
      options={toOptions(options)}
      placeholder={placeholder}
    />
  );
}

const YES_NO_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** Tri-state: '' (not specified), 'true', 'false' */
export function YesNoSelect({ value, onChange, ...props }) {
  return (
    <Dropdown
      {...props}
      variant="field"
      value={value}
      onChange={onChange}
      options={YES_NO_OPTIONS}
      placeholder="Not specified"
    />
  );
}

export function CheckboxGroup({ value = [], onChange, options }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {toOptions(options).map((o) => {
        const active = value.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => toggle(o.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              active
                ? 'bg-brand-100 border-brand-400 text-ink'
                : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
