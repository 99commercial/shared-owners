import { useSearchParams } from 'react-router-dom';
import { RANGE_OPTIONS } from '../data/adminOptions';

const DEFAULT_DAYS = 30;

/** Analytics date range (days) kept in the URL as ?days= */
export default function useRange() {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get('days'));
  const days = RANGE_OPTIONS.some((o) => o.value === requested) ? requested : DEFAULT_DAYS;
  const setDays = (value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === DEFAULT_DAYS) next.delete('days');
      else next.set('days', String(value));
      return next;
    }, { replace: true });
  const label = RANGE_OPTIONS.find((o) => o.value === days)?.label;
  return { days, setDays, label };
}
