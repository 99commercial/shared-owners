/** Single labelled checkbox used for the "apply to every home" style switches */
export default function CheckboxField({ checked, onChange, label, hint, disabled }) {
  return (
    <label className={`flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 ${disabled ? 'opacity-60' : 'cursor-pointer hover:border-brand-300'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 w-4 h-4 accent-brand-600"
      />
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {hint && <span className="block text-xs text-gray-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}
