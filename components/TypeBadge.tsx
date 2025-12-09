
import React from 'react';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

// Authentic Pokemon Type Colors (Vibrant & Distinct)
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
  if (t.includes('käfer')) return 'bg-[#A6B91A]';
  if (t.includes('gestein')) return 'bg-[#B6A136]';
  if (t.includes('geist')) return 'bg-[#735797]';
  if (t.includes('drache')) return 'bg-[#6F35FC]';
  if (t.includes('unlicht')) return 'bg-[#705746]';
  if (t.includes('stahl')) return 'bg-[#B7B7CE]';
  if (t.includes('fee')) return 'bg-[#D685AD]';
  return 'bg-gray-400';
};

// High-Fidelity "Authentic" Icons (TCG/GO Style)
const TYPE_ICONS: Record<string, React.ReactNode> = {
  Normal: (
    <g>
      <circle cx="12" cy="12" r="8" fillOpacity="0.3" />
      <circle cx="12" cy="12" r="4" />
    </g>
  ),
  Feuer: (
    <path d="M11.51 2.02c0 0 5.86 6.36 5.86 10.96 0 2.87-1.57 5.17-4.43 6.64 2.86-1.07 3.56-4.32 3.12-5.46-.08-.22-.38-.2-.44.03-.43 1.5-1.95 2.58-3.09 2.58-1.55 0-2.31-1.38-2.31-3.21 0-1.3.17-2.12 1.35-3.83.33-.47.04-1.12-.53-1.15-2.73-.13-5.23 2.54-5.23 6.13 0 1.25.31 2.37.81 3.26-.64-.67-1.08-1.57-1.08-2.92 0-3.37 2.66-6.43 2.66-6.43s1.39-2.5 3.31-6.6z" />
  ),
  Wasser: (
    <path d="M12 2.01c-.18 0-.36.08-.48.23-2.7 3.4-6.49 8.24-6.49 12.01 0 3.86 3.14 7 7 7s7-3.14 7-7c0-3.77-3.8-8.61-6.5-12.01-.13-.15-.31-.23-.53-.23zm-.12 3.82c1.76 2.45 4.3 6.09 4.3 8.42 0 2.32-1.89 4.2-4.22 4.2-2.32 0-4.21-1.88-4.21-4.2 0-2.33 2.51-5.96 4.13-8.42z" />
  ),
  Pflanze: (
    <path d="M11.93 2.03c-2.85 2.14-2.8 4.79-1.97 6.32-1.9-1.66-4.52-1.12-5.95 1.13-1.39 2.19-.51 5.3 1.94 5.92-.35.53-.54 1.19-.34 2.11.28 1.34 1.16 2.36 2.21 3.01 1.76 1.09 3.86 1.05 3.86 1.05s2.78-.37 4.14-2.18c1.02-1.36.93-3.18.15-4.59 2.47-1.29 2.76-4.7 1.08-6.52-1.59-1.72-4.4-1.63-5.89.54.3-1.44-.08-4.76 1.5-6.57-.46.03-.63-.22-.73-.22z" />
  ),
  Elektro: (
    <path d="M17.42 2.05L6.5 13.5h5.18l-3.32 8.45 10.93-11.45h-5.18z" />
  ),
  Eis: (
    <path d="M12 2l-2.03 4.18H5.8L7.9 9.9 5.8 14h4.17L12 18.18 14.03 14h4.17l-2.1-4.1 2.1-3.72h-4.17z" />
  ),
  Kampf: (
    <path d="M6.34 2.75a3.64 3.64 0 0 0-3.4 3.64c0 1.25.64 2.36 1.62 3.03l-1.39 2.22 1.98 2.07 1.48-1.48 1.93 1.93 5.48-5.48-1.93-1.93 1.48-1.48-2.07-1.98-2.22 1.39A3.62 3.62 0 0 0 6.34 2.75z" />
  ),
  Gift: (
    <path d="M11.9 2.1a4.9 4.9 0 0 0-3.8 1.8 4.9 4.9 0 0 0 1.5 7.4l-.4 5.3h5.4l-.4-5.3A4.9 4.9 0 0 0 15.7 3.9a4.9 4.9 0 0 0-3.8-1.8zm-3.2 11.5l.5 7.4h5.4l.5-7.4H8.7z" />
  ),
  Boden: (
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-4.5 5h3l3.5 6H8l-4 5h11l-3.5-6H17l-4-5z" />
  ),
  Flug: (
    <path d="M12 3.5s-2.5 2-2.5 5c0 3 2 4.5 2 4.5s-4-1-6 2c-1.5 2.25 0 6 0 6s4.5-2 8-5.5c3.5 3.5 8 5.5 8 5.5s1.5-3.75 0-6c-2-3-6-2-6-2s2-1.5 2-4.5c0-3-2.5-5-2.5-5H12z" />
  ),
  Psycho: (
    <path d="M21.2 11.8c-.8-5.1-5.3-8.8-10.4-8.8-4.4 0-8.2 2.8-9.8 6.7 1.1-.7 2.5-1.1 3.9-1.1 4 0 7.3 3.3 7.3 7.3 0 .7-.1 1.4-.3 2 .8.1 1.6.1 2.3.1 3.7 0 6.8-2.8 7-6.2zM8 12.8c0-2.3 1.5-4.2 3.6-5 1.5-.6 3.2-.2 4.4.8.8 1.1 1.2 2.5 1 3.9-.6 2.5-3.1 4.2-5.6 3.6-2-.5-3.4-2.1-3.4-4.1z" />
  ),
  Käfer: (
    <path d="M12 3c-3.3 0-6 2.7-6 6 0 .5.1.9.2 1.4L4 12v2h2.2c.4 2.6 2.6 4.6 5.3 4.9V21h1v-2.1c2.7-.3 4.9-2.3 5.3-4.9H20v-2l-2.2-1.6c.1-.5.2-.9.2-1.4 0-3.3-2.7-6-6-6zm0 2c2.2 0 4 1.8 4 4 0 .7-.2 1.4-.6 2H8.6C8.2 10.4 8 9.7 8 9c0-2.2 1.8-4 4-4z" />
  ),
  Gestein: (
    <path d="M4 18h16l-3-6-4 4-2-2-3 4-4-6L2 18h2zm8-16L7 10h10L12 2z" />
  ),
  Geist: (
    <path d="M12 2C7.58 2 4 5.58 4 10v9.17c0 .59.75.85 1.11.41l2.44-2.93 2.44 2.93c.36.44 1.11.44 1.47 0l2.44-2.93 2.44 2.93c.36.44 1.11.18 1.11-.41V10c0-4.42-3.58-8-8-8zm-3 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
  ),
  Drache: (
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 17c-2.33 0-4.32-1.32-5.3-3.26.83-2.26 2.98-3.88 5.5-3.9 2.53.02 4.69 1.66 5.51 3.94-.98 1.93-2.97 3.22-5.29 3.22V19h-.42v.01zm0-9C9.52 10 7.5 7.99 7.5 5.5c0-.28.22-.5.5-.5s.5.22.5.5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5c0-.28.22-.5.5-.5s.5.22.5.5c0 2.49-2.02 4.5-4.5 4.5z" />
  ),
  Unlicht: (
    <path d="M12 2C9.5 2 7.5 3 6 5c3 1 6 4 6 8s-3 7-6 8c1.5 2 3.5 3 6 3 5.5 0 10-4.5 10-10S17.5 2 12 2zm-1 15c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
  ),
  Stahl: (
    <path d="M12 2l-2.5 5h-5l2.5 5-2.5 5h5l2.5 5 2.5-5h5l-2.5-5 2.5-5h-5z" />
  ),
  Fee: (
    <path d="M12 2l-3 6-6.5.5 5 4.5-1.5 6 6-3.5 6 3.5-1.5-6 5-4.5-6.5-.5z" />
  )
};

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, size = 'md', showLabel = false }) => {
  const colorClass = getTypeColor(type);
  const icon = TYPE_ICONS[type] || TYPE_ICONS['Normal'];
  
  const sizeClasses = {
    sm: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-[9px]' },
    md: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-xs' },
    lg: { container: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-sm' },
    xl: { container: 'w-14 h-14', icon: 'w-9 h-9', text: 'text-base' }
  };

  const { container, icon: iconSize, text } = sizeClasses[size];

  return (
    <div className="inline-flex items-center gap-1.5 group">
        <div className={`${container} rounded-full ${colorClass} flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.1)] border-2 border-white/20 shrink-0 transform transition-transform group-hover:scale-110`}>
            <svg 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className={`${iconSize} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`}
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
