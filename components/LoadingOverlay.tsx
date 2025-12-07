import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-24 h-24 animate-spin">
        <div className="absolute inset-0 rounded-full border-8 border-t-red-500 border-b-white border-l-transparent border-r-transparent"></div>
        <div className="absolute inset-4 bg-white rounded-full border-4 border-gray-800 flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
        </div>
      </div>
      <p className="mt-6 text-white text-xl font-bold tracking-wider animate-pulse">
        Lade Daten...
      </p>
    </div>
  );
};
