
import React from 'react';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Normal: <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 14a4 4 0 114-4 4 4 0 01-4 4z" />,
  Feuer: <path d="M12 2.5a.5.5 0 01.42.79C13.82 5.5 16.5 8 16.5 11.5a4.5 4.5 0 01-9 0c0-1.87 1.15-3.5 3.5-5 0 1.5 1 2.5 1 2.5s3-3 0-6.5z" />,
  Wasser: <path d="M12 2.5s-6 5.5-6 10.5c0 3.31 2.69 6 6 6s6-2.69 6-6C18 8 12 2.5 12 2.5zm0 5a2 2 0 012 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2z" />,
  Pflanze: <path d="M16.5 6A5.5 5.5 0 0011 11.5c0 1.8.88 3.5 2.5 4.5-.5.2-1 .3-1.5.3-2.5 0-4.5-1.5-5-3.5.5-2.5 2.5-4 4.5-4 .5 0 1 .1 1.5.2A5.5 5.5 0 007.5 6 5.5 5.5 0 002 11.5C2 16.2 7 19.5 12 19.5s10-3.3 10-8A5.5 5.5 0 0016.5 6z" />,
  Elektro: <path d="M11.5 2L6 12h5l-1.5 10L20 10h-6l2.5-8h-5z" />,
  Eis: <path d="M12 2L9.5 6.5h5L12 2zm-7 4l2 4.5 4.5-2-4.5-2.5H5zm14 0l-2 2.5-4.5 2 4.5 2 2-4.5zM4 12l4.5 2-2 4.5L4 12zm16 0l-2.5 6.5-2-4.5 4.5-2zM12 22l2.5-4.5h-5L12 22z" />,
  Kampf: <path d="M16 4.5a3.5 3.5 0 10-7 0v2h7v-2zM9 8v4h6V8H9zm-2 2v6h10v-6h2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6h2z" />,
  Gift: <path d="M12 2a4 4 0 00-4 4v2h8V6a4 4 0 00-4-4zm-5 8v2a5 5 0 0010 0v-2H7zm3.5 1a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm3 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />,
  Boden: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16l-3-4h6l-3 4zm-5-6l3-4 3 4H7z" />,
  Flug: <path d="M12 2C9 2 5 4 4 8c0 3 4 5 4 8h2v-4h2v4h2c0-3 4-5 4-8s-5-6-8-6z" />,
  Psycho: <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-2-6a2 2 0 114 0 2 2 0 01-4 0z" />,
  Käfer: <path d="M12 2c-3 0-5 2-5 5v2H5v2h2v2H5v2h2v3h2v-3h6v3h2v-3h2v-2h-2v-2h2V9h-2V7c0-3-2-5-5-5zm-2 5h4v2h-4V7zm0 4h4v2h-4v-2z" />,
  Gestein: <path d="M4 18h16l-2-12H6L4 18zm5-7h6l1 4H8l1-4z" />,
  Geist: <path d="M12 2a6 6 0 00-6 6v10l3-3 3 3 3-3 3 3V8a6 6 0 00-6-6zm-2 7a1 1 0 110 2 1 1 0 010-2zm4 0a1 1 0 110 2 1 1 0 010-2z" />,
  Drache: <path d="M6 4l2 6 4-2 4 2 2-6H6zm6 7l-2 3-4-2v6h12v-6l-4 2-2-3z" />,
  Unlicht: <path d="M12 2C9.5 2 7.3 3.3 6 5.3c3.6 1 6.3 4.3 6.3 8.2 0 .5-.1 1-.2 1.5 1.3-.3 2.5-.9 3.4-1.8 1.9-1.9 2.8-4.5 2.5-7.2-.6-2.2-2.3-3.8-4.5-4-1.1-.1-2.2.2-3.2.7.5-.2 1.1-.5 1.7-.5z" />,
  Stahl: <path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 4a2 2 0 110 4 2 2 0 010-4zm-4 8a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4z" />,
  Fee: <path d="M12 2l2.5 6.5L21 11l-5 4.5L17.5 22 12 18.5 6.5 22 8 15.5 3 11l6.5-2.5L12 2z" />
};

export const getTypeColor = (type: string): string => {
  const t = type.toLowerCase();
  if (t.includes('feuer')) return 'bg-orange-500';
  if (t.includes('wasser')) return 'bg-blue-500';
  if (t.includes('pflanze')) return 'bg-green-500';
  if (t.includes('elektro')) return 'bg-yellow-400';
  if (t.includes('eis')) return 'bg-cyan-300';
  if (t.includes('kampf')) return 'bg-red-700';
  if (t.includes('gift')) return 'bg-purple-500';
  if (t.includes('boden')) return 'bg-yellow-600';
  if (t.includes('flug')) return 'bg-indigo-300';
  if (t.includes('psycho')) return 'bg-pink-500';
  if (t.includes('käfer')) return 'bg-lime-500';
  if (t.includes('gestein')) return 'bg-yellow-800';
  if (t.includes('geist')) return 'bg-indigo-700';
  if (t.includes('drache')) return 'bg-violet-600';
  if (t.includes('unlicht')) return 'bg-gray-700';
  if (t.includes('stahl')) return 'bg-slate-400';
  if (t.includes('fee')) return 'bg-pink-300';
  return 'bg-gray-400';
};

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, size = 'md', showLabel = false }) => {
  const colorClass = getTypeColor(type);
  const icon = TYPE_ICONS[type] || TYPE_ICONS['Normal'];
  
  const sizeClasses = {
    sm: { container: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-xs' },
    md: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-sm' },
    lg: { container: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-base' },
    xl: { container: 'w-12 h-12', icon: 'w-8 h-8', text: 'text-lg' }
  };

  const { container, icon: iconSize, text } = sizeClasses[size];

  return (
    <div className="inline-flex items-center gap-2">
        <div className={`${container} rounded-full ${colorClass} flex items-center justify-center shadow-sm shrink-0`}>
            <svg 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className={`${iconSize} text-white drop-shadow-sm`}
            >
                {icon}
            </svg>
        </div>
        {showLabel && (
            <span className={`font-bold text-gray-700 uppercase ${text}`}>
                {type}
            </span>
        )}
    </div>
  );
};
