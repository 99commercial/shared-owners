import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

const MENU_MAX_HEIGHT = 288;
const MENU_GAP = 6;

const TRIGGER_STYLES = {
  /** Toolbar filters next to search inputs (public pages, tables) */
  filter:
    'flex items-center gap-2 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-left transition-colors',
  /** Form fields; reuses the dashboard input so floating labels and icons line up */
  field: 'dash-input flex items-center gap-2 text-left',
  /** Borderless, e.g. "Rows per page" in table footers */
  inline: 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-ink hover:bg-gray-100',
};

const LABEL_COLOR = {
  filter: ({ isFiltered }) => (isFiltered ? 'text-brand-700 font-medium' : 'text-gray-700'),
  field: ({ isPlaceholder }) => (isPlaceholder ? 'text-gray-400' : 'text-gray-900'),
  inline: () => 'text-ink',
};

const toOptions = (options) =>
  options.map((o) => (typeof o === 'object' ? o : { value: String(o), label: String(o) }));

/**
 * Custom select used everywhere instead of a native <select>.
 * `options`: strings or { value, label }. With `placeholder`, an extra '' option
 * is listed first so the choice can be cleared (e.g. "All types").
 */
export default function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  variant = 'filter',
  icon: Icon,
  disabled = false,
  className = '',
  menuClassName = '',
  'aria-label': ariaLabel,
}) {
  const id = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const typeahead = useRef({ text: '', timer: null });
  const [open, setOpenState] = useState(false);
  const [highlight, setHighlightState] = useState(-1);
  const [position, setPosition] = useState(null);
  // Mirrors of the state above, so key presses arriving before a re-render see the latest values
  const openRef = useRef(false);
  const highlightRef = useRef(-1);

  const setOpen = (next) => {
    openRef.current = next;
    setOpenState(next);
  };
  const setHighlight = (next) => {
    highlightRef.current = typeof next === 'function' ? next(highlightRef.current) : next;
    setHighlightState(highlightRef.current);
  };

  const items = [
    ...(placeholder !== undefined ? [{ value: '', label: placeholder }] : []),
    ...toOptions(options),
  ];
  const current = String(value ?? '');
  const selectedIndex = items.findIndex((o) => String(o.value) === current);
  const selected = items[selectedIndex];
  const isPlaceholder = !selected || selected.value === '';
  /** A filter with an "All …" option that is narrowed to a specific value */
  const isFiltered = placeholder !== undefined && !isPlaceholder;

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom;
    const openUp = below < MENU_MAX_HEIGHT + MENU_GAP && rect.top > below;
    setPosition({
      left: rect.left,
      minWidth: rect.width,
      maxHeight: Math.min(MENU_MAX_HEIGHT, (openUp ? rect.top : below) - MENU_GAP * 2),
      ...(openUp ? { bottom: window.innerHeight - rect.top + MENU_GAP } : { top: rect.bottom + MENU_GAP }),
    });
  }, []);

  const openMenu = () => {
    if (disabled) return;
    place();
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const choose = (index) => {
    const option = items[index];
    if (!option) return;
    if (String(option.value) !== current) onChange(String(option.value));
    close();
    triggerRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (!triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) close();
    };
    const handleScroll = (e) => {
      if (!menuRef.current?.contains(e.target)) place();
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (open && highlight >= 0) {
      document.getElementById(`${id}-opt-${highlight}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlight, id]);

  const jumpToTyped = (key) => {
    const state = typeahead.current;
    clearTimeout(state.timer);
    state.text += key.toLowerCase();
    state.timer = setTimeout(() => { state.text = ''; }, 500);
    const start = openRef.current ? highlightRef.current + 1 : 0;
    const ordered = [...items.slice(start), ...items.slice(0, start)];
    const match = ordered.find((o) => String(o.label).toLowerCase().startsWith(state.text));
    if (match) setHighlight(items.indexOf(match));
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (!openRef.current) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setHighlight(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlight(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(highlightRef.current);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) jumpToTyped(e.key);
    }
  };

  const filterState = variant === 'filter'
    ? open
      ? 'border-brand-500 ring-3 ring-brand-500/15'
      : isFiltered
        ? 'border-brand-300 bg-brand-50/60 hover:border-brand-400'
        : 'border-gray-300 hover:border-gray-400'
    : '';
  const fieldState = variant === 'field' && open ? 'border-brand-500! shadow-[0_0_0_3px_rgb(37_99_235/0.15)]!' : '';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open && highlight >= 0 ? `${id}-opt-${highlight}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (openRef.current ? close() : openMenu())}
        onKeyDown={handleKeyDown}
        className={`${TRIGGER_STYLES[variant]} ${filterState} ${fieldState} focus:outline-none focus-visible:border-brand-500 focus-visible:ring-3 focus-visible:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {Icon && variant !== 'field' && <Icon className="w-4 h-4 shrink-0 text-brand-500" />}
        <span className={`flex-1 truncate ${LABEL_COLOR[variant]({ isPlaceholder, isFiltered })}`}>
          {selected ? selected.label : placeholder ?? 'Select…'}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-150 ${open ? 'rotate-180 text-brand-500' : 'text-gray-400'}`}
        />
      </button>

      {open && position && createPortal(
        <ul
          ref={menuRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-label={ariaLabel}
          style={position}
          className={`dropdown-menu fixed z-[1000] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl shadow-gray-900/10 ${menuClassName}`}
        >
          {items.map((option, index) => {
            // In forms the empty entry only clears the field, so it is never shown as a choice
            const isSelected = index === selectedIndex && !(variant === 'field' && option.value === '');
            const isActive = index === highlight;
            return (
              <li
                key={`${option.value}-${index}`}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(index)}
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer select-none whitespace-nowrap ${
                  isActive ? 'bg-brand-50' : ''
                } ${isSelected ? 'text-brand-700 font-semibold' : option.value === '' ? 'text-gray-500' : 'text-gray-700'}`}
              >
                <span>{option.label}</span>
                <Check className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-600' : 'invisible'}`} />
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </>
  );
}
