import React from 'react';
import { WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-900 text-amber-50 text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 font-medium"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
      <span>Sei offline: puoi consultare il catalogo salvato; gli ordini richiedono una connessione attiva.</span>
    </div>
  );
};
