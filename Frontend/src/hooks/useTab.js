import { useSearchParams } from 'react-router-dom';

/** Active tab of a detail page, kept in the URL as ?tab= so it survives reloads and links */
export default function useTab(tabs, defaultTab = tabs[0]) {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = tabs.includes(requested) ? requested : defaultTab;
  const setTab = (next) =>
    setParams((prev) => {
      const copy = new URLSearchParams();
      if (next !== defaultTab) copy.set('tab', next);
      // Each tab's table keeps its own prefixed params; drop the others' when switching
      prev.forEach((value, key) => {
        if (key.startsWith(`${next}.`)) copy.set(key, value);
      });
      return copy;
    });
  return [tab, setTab];
}
