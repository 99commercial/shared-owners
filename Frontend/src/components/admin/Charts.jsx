import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CHART_COLORS } from '../../data/adminOptions';
import { formatNumber, shortDay } from '../../utils/format';

const niceMax = (value) => {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude * 4 >= value) * magnitude;
  return step * 4;
};

/**
 * Daily trend for one or more series. data = [{ date: 'YYYY-MM-DD', [key]: n }],
 * series = [{ key, label, color }]. `type="bar"` stacks the series per day.
 */
export function TrendChart({ data = [], series, type = 'area', height = 220 }) {
  const gradientId = useId();
  const [hover, setHover] = useState(null);
  const count = data.length;

  const max = useMemo(() => {
    const peak = Math.max(
      0,
      ...data.map((d) => (type === 'bar'
        ? series.reduce((sum, s) => sum + (d[s.key] || 0), 0)
        : Math.max(...series.map((s) => d[s.key] || 0))))
    );
    return niceMax(peak);
  }, [data, series, type]);

  if (!count) return <div style={{ height }} className="flex items-center justify-center text-sm text-gray-400">No data yet</div>;

  const W = 1000;
  const H = 300;
  const x = (i) => (count === 1 ? W / 2 : (i / (count - 1)) * W);
  const y = (v) => H - (v / max) * H;
  const labelEvery = Math.max(1, Math.ceil(count / 7));
  const barWidth = (W / count) * 0.62;
  const hovered = hover !== null ? data[hover] : null;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHover(Math.min(count - 1, Math.max(0, type === 'bar' ? Math.floor(ratio * count) : Math.round(ratio * (count - 1)))));
  };
  const hoverLeft = hover === null ? 0 : type === 'bar' ? ((hover + 0.5) / count) * 100 : (x(hover) / W) * 100;

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-[10px] text-gray-400 text-right w-8 shrink-0" style={{ height }}>
          {[4, 3, 2, 1, 0].map((i) => <span key={i} className="leading-none">{formatNumber((max / 4) * i)}</span>)}
        </div>
        <div className="relative flex-1 min-w-0" style={{ height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`${gradientId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1="0" x2={W} y1={(H / 4) * i} y2={(H / 4) * i} stroke="#eef0f3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
            {type === 'bar'
              ? data.map((d, i) => {
                let base = H;
                return series.map((s) => {
                  const h = ((d[s.key] || 0) / max) * H;
                  base -= h;
                  return h > 0 ? (
                    <rect
                      key={`${d.date}-${s.key}`}
                      x={(i + 0.5) * (W / count) - barWidth / 2}
                      y={base}
                      width={barWidth}
                      height={h}
                      fill={s.color}
                      opacity={hover === null || hover === i ? 1 : 0.45}
                    />
                  ) : null;
                });
              })
              : series.map((s, si) => {
                const points = data.map((d, i) => `${x(i)},${y(d[s.key] || 0)}`).join(' ');
                return (
                  <g key={s.key}>
                    <polygon points={`0,${H} ${points} ${W},${H}`} fill={`url(#${gradientId}-${si})`} />
                    <polyline points={points} fill="none" stroke={s.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                  </g>
                );
              })}
          </svg>
          {hovered && (
            <>
              {type !== 'bar' && <div className="absolute top-0 bottom-0 w-px bg-gray-300 pointer-events-none" style={{ left: `${hoverLeft}%` }} />}
              <div
                className="absolute z-10 -top-2 pointer-events-none rounded-lg bg-ink text-white text-xs px-3 py-2 shadow-lg whitespace-nowrap"
                style={{ left: `${hoverLeft}%`, transform: `translate(${hoverLeft > 70 ? '-105%' : '8px'}, 0)` }}
              >
                <div className="font-semibold mb-1">{shortDay(hovered.date)}</div>
                {series.map((s) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                    <span className="text-white/70">{s.label}</span>
                    <span className="ml-auto pl-3 font-semibold">{formatNumber(hovered[s.key])}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="relative h-5 mt-1.5 ml-10">
        {data.map((d, i) => (i % labelEvery === 0 || i === count - 1 ? (
          <span
            key={d.date}
            className="absolute text-[10px] text-gray-400 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${type === 'bar' ? ((i + 0.5) / count) * 100 : (x(i) / W) * 100}%` }}
          >
            {shortDay(d.date)}
          </span>
        ) : null))}
      </div>
    </div>
  );
}

/** Horizontal bars: items = [{ label, value, color?, to?, sub? }] */
export function BarList({ items = [], formatValue = formatNumber, empty = 'Nothing to show yet', color = '#2563eb' }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  if (!items.length || max === 0) return <p className="text-sm text-gray-400 py-4 text-center">{empty}</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
              <span className="text-gray-700 truncate">{item.label}</span>
              <span className="font-semibold text-ink shrink-0">
                {formatValue(item.value)}
                {item.sub && <span className="text-xs font-normal text-gray-400 ml-1.5">{item.sub}</span>}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.max((item.value / max) * 100, item.value ? 3 : 0)}%`, background: item.color || color }}
              />
            </div>
          </>
        );
        return item.to ? (
          <Link key={item.key || item.label} to={item.to} className="block hover:opacity-80">{content}</Link>
        ) : (
          <div key={item.key || item.label}>{content}</div>
        );
      })}
    </div>
  );
}

/** Ring chart with a legend: items = [{ label, value, color? }] */
export function Donut({ items = [], centerLabel = 'Total', size = 150, thickness = 20 }) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          {total > 0 && items.map((item, i) => {
            const length = (item.value / total) * c;
            const el = (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={item.color || CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={thickness}
                strokeDasharray={`${length} ${c - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-ink leading-none">{formatNumber(total)}</span>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex-1 w-full space-y-1.5 min-w-0">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color || CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-gray-600 truncate">{item.label}</span>
            <span className="ml-auto font-semibold text-ink">{formatNumber(item.value)}</span>
            <span className="w-10 text-right text-xs text-gray-400">{total ? Math.round((item.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One full-width bar split by share, e.g. listings by status: items = [{ label, value, color }] */
export function SplitBar({ items = [] }) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {total > 0 && items.map((item) => (item.value ? (
          <div key={item.label} title={`${item.label}: ${item.value}`} style={{ width: `${(item.value / total) * 100}%`, background: item.color }} />
        ) : null))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {items.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            {item.label} <strong className="text-ink">{formatNumber(item.value)}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
