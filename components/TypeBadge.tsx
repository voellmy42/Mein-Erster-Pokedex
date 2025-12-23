import React from 'react';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

// Authentic Pokemon Type Colors (Vibrant & Distinct) - Kept for usage in other components (e.g. background bubbles)
export const getTypeColor = (type: string): string => {
  const t = type.toLowerCase();
  if (t.includes('normal')) return 'bg-[#A8A77A]';
  if (t.includes('feuer')) return 'bg-[#EE8130]';
  if (t.includes('wasser')) return 'bg-[#6390F0]';
  if (t.includes('pflanze')) return 'bg-[#7AC74C]';
  if (t.includes('elektro')) return 'bg-[#F7D02C]';
  if (t.includes('eis')) return 'bg-[#96D9D6]';
  if (t.includes('kampf')) return 'bg-[#C22E28]';
  if (t.includes('gift')) return 'bg-[#A33EA1]';
  if (t.includes('boden')) return 'bg-[#E2BF65]';
  if (t.includes('flug')) return 'bg-[#A98FF3]';
  if (t.includes('psycho')) return 'bg-[#F95587]';
  if (t.includes('käfer') || t.includes('kaefer')) return 'bg-[#A6B91A]';
  if (t.includes('gestein')) return 'bg-[#B6A136]';
  if (t.includes('geist')) return 'bg-[#735797]';
  if (t.includes('drache')) return 'bg-[#6F35FC]';
  if (t.includes('unlicht')) return 'bg-[#705746]';
  if (t.includes('stahl')) return 'bg-[#B7B7CE]';
  if (t.includes('fee')) return 'bg-[#D685AD]';
  return 'bg-gray-400';
};

// New High-Fidelity Icons
const TYPE_ICONS: Record<string, React.ReactNode> = {
  Normal: (
    <>
      <circle cx="50" cy="50" r="48" fill="#A8A878" />
      <circle cx="50" cy="50" r="22" stroke="white" strokeWidth="6" fill="none" />
    </>
  ),
  Feuer: (
    <>
      <circle cx="50" cy="50" r="48" fill="#F08030" />
      <path d="M50 15C50 15 72 38 72 58C72 70 62 80 50 80C38 80 28 70 28 58C28 45 35 38 35 38L45 45L50 15Z" fill="white" />
    </>
  ),
  Wasser: (
    <>
      <circle cx="50" cy="50" r="48" fill="#6890F0" />
      <path d="M50 18C50 18 28 48 28 66C28 78 38 85 50 85C62 85 72 78 72 66C72 48 50 18 50 18Z" fill="white" />
    </>
  ),
  Pflanze: (
    <>
      <circle cx="50" cy="50" r="48" fill="#78C850" />
      <path d="M72 28C52 28 32 43 32 68C52 68 72 53 72 28Z" fill="white" />
      <path d="M32 68L72 28" stroke="#78C850" strokeWidth="4" />
    </>
  ),
  Elektro: (
    <>
      <circle cx="50" cy="50" r="48" fill="#F8D030" />
      <path d="M55 15L30 55H50L45 85L70 45H50L55 15Z" fill="white" />
    </>
  ),
  Eis: (
    <>
      <circle cx="50" cy="50" r="48" fill="#98D8D8" />
      <path d="M50 20V80M20 50H80M30 30L70 70M70 30L30 70" stroke="white" strokeWidth="8" strokeLinecap="round" />
    </>
  ),
  Kampf: (
    <>
      <circle cx="50" cy="50" r="48" fill="#C03028" />
      <path d="M30 45V72H70V45L60 35H40L30 45Z" fill="white" />
      <rect x="37" y="45" width="6" height="15" fill="#C03028" />
      <rect x="47" y="45" width="6" height="15" fill="#C03028" />
      <rect x="57" y="45" width="6" height="15" fill="#C03028" />
    </>
  ),
  Gift: (
    <>
      <circle cx="50" cy="50" r="48" fill="#A040A0" />
      <path d="M50 25C38 25 30 33 30 45C30 55 35 60 40 62V75H60V62C65 60 70 55 70 45C70 33 62 25 50 25Z" fill="white" />
      <circle cx="42" cy="45" r="3" fill="#A040A0" />
      <circle cx="58" cy="45" r="3" fill="#A040A0" />
    </>
  ),
  Boden: (
    <>
      <circle cx="50" cy="50" r="48" fill="#E0C068" />
      <path d="M20 75L40 40L60 75M50 75L75 45L90 75" fill="none" stroke="white" strokeWidth="8" strokeLinejoin="round" />
    </>
  ),
  Flug: (
    <>
      <circle cx="50" cy="50" r="48" fill="#A890F0" />
      <path d="M20 45C40 30 60 30 80 45L50 70L20 45Z" fill="white" />
    </>
  ),
  Psycho: (
    <>
      <circle cx="50" cy="50" r="48" fill="#F85888" />
      <path d="M20 50C20 50 35 30 50 30C65 30 80 50 80 50C80 50 65 70 50 70C35 70 20 50 20 50Z" stroke="white" strokeWidth="6" fill="none" />
      <circle cx="50" cy="50" r="8" fill="white" />
    </>
  ),
  Käfer: (
    <>
      <circle cx="50" cy="50" r="48" fill="#A8B820" />
      <path d="M50 30C40 30 35 40 35 55C35 70 40 80 50 80C60 80 65 70 65 55C65 40 60 30 50 30Z" fill="white" />
      <path d="M35 45L22 40M35 65L22 70M65 45L78 40M65 65L78 70" stroke="white" strokeWidth="4" />
    </>
  ),
  Gestein: (
    <>
      <circle cx="50" cy="50" r="48" fill="#B8A038" />
      <path d="M30 70L25 45L50 22L75 40L70 75L30 70Z" fill="white" />
    </>
  ),
  Geist: (
    <>
      <circle cx="50" cy="50" r="48" fill="#705898" />
      <path d="M30 45C30 30 50 20 70 45V68L60 62L50 68L40 62L30 68V45Z" fill="white" />
      <circle cx="42" cy="45" r="4" fill="#705898" />
      <circle cx="58" cy="45" r="4" fill="#705898" />
    </>
  ),
  Drache: (
    <>
      <circle cx="50" cy="50" r="48" fill="#7038F8" />
      <path d="M30 30C30 30 25 75 50 75C75 75 70 30 70 30L50 50L30 30Z" fill="white" />
    </>
  ),
  Unlicht: (
    <>
      <circle cx="50" cy="50" r="48" fill="#705848" />
      <path d="M65 30C50 30 35 45 35 60C35 75 50 85 65 85C55 85 45 75 45 60C45 45 55 30 65 30Z" fill="white" />
    </>
  ),
  Stahl: (
    <>
      <circle cx="50" cy="50" r="48" fill="#B8B8D0" />
      <circle cx="50" cy="50" r="18" stroke="white" strokeWidth="8" fill="none" />
      <path d="M50 12V30M50 70V88M12 50H30M70 50H88M23 23L35 35M65 65L77 77" stroke="white" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  Fee: (
    <>
      <circle cx="50" cy="50" r="48" fill="#EE99AC" />
      <path d="M50 20L58 40H80L63 52L70 75L50 60L30 75L37 52L20 40H42L50 20Z" fill="white" />
    </>
  )
};

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, size = 'md', showLabel = false }) => {
  const normalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  const icon = TYPE_ICONS[normalizedType] || TYPE_ICONS['Normal'];

  const sizeClasses = {
    sm: { container: 'w-6 h-6', text: 'text-[9px]' },
    md: { container: 'w-8 h-8', text: 'text-xs' },
    lg: { container: 'w-10 h-10', text: 'text-sm' },
    xl: { container: 'w-14 h-14', text: 'text-base' }
  };

  const { container, text } = sizeClasses[size];

  return (
    <div className="inline-flex items-center gap-1.5 group">
      <div className={`${container} shrink-0 transform transition-transform group-hover:scale-110`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
        >
          {icon}
        </svg>
      </div>
      {showLabel && (
        <span className={`font-black text-gray-700 uppercase tracking-tight ${text}`}>
          {type}
        </span>
      )}
    </div>
  );
};
