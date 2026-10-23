export default function PartyAvatar({ party, size = 'md' }) {
  const box = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-sm';
  if (party?.avatarUrl) {
    return <img src={party.avatarUrl} alt="" className={`${box} rounded-full object-cover bg-gray-100 shrink-0`} />;
  }
  const letter = (party?.name || '?').slice(0, 1).toUpperCase();
  return (
    <span className={`${box} rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center shrink-0`}>
      {letter}
    </span>
  );
}
