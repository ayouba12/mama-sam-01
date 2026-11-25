import React from 'react';
import { Download } from 'lucide-react';

interface PWAInstallButtonProps {
  canInstall: boolean;
  onInstall: () => Promise<boolean>;
  variant?: 'header' | 'footer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  canInstall,
  onInstall,
  variant = 'header'
}) => {
  if (!canInstall) return null;

  if (variant === 'footer') {
    return (
      <button
        type="button"
        onClick={onInstall}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-[11px] font-semibold transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>Installa App Mama Sam</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onInstall}
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#124b2e] text-xs font-semibold transition-colors cursor-pointer"
      title="Installa l'app Mama Sam sul tuo dispositivo"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Installa App</span>
    </button>
  );
};
