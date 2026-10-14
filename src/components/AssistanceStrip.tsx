import React from 'react';
import { StoreSettings } from '../types';

interface AssistanceStripProps {
  settings: StoreSettings;
}

export const AssistanceStrip: React.FC<AssistanceStripProps> = ({ settings }) => {
  return (
    <div className="bg-[#124b2e] text-white py-3.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="text-xs sm:text-sm font-medium text-emerald-100">
          Hai domande su ingredienti specifici o sul ritiro dell'ordine? Siamo qui per aiutarti.
        </p>

        <a
          href={`tel:${settings.phone1.replace(/\s+/g, '')}`}
          className="px-4 py-2 bg-emerald-700/60 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold border border-emerald-500/40 transition-colors shadow-2xs"
        >
          Chiama {settings.phone1}
        </a>
      </div>
    </div>
  );
};
