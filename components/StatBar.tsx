import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  color?: string;
}

export const StatBar: React.FC<StatBarProps> = ({ label, value, color = 'bg-blue-500' }) => {
  const percentage = Math.min((value / 255) * 100, 100);

  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="w-20 text-sm font-black text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="w-10 text-base font-black text-gray-800 text-right">{value}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};