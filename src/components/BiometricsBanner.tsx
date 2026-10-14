import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface BiometricsBannerProps {
  onOpenBiometrics: () => void;
}

export const BiometricsBanner: React.FC<BiometricsBannerProps> = ({
  onOpenBiometrics
}) => {
  return (
    <section className="bg-[#0b3b22] text-white py-4 sm:py-5 border-y border-emerald-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Info */}
        <div className="flex items-center gap-3.5 text-center md:text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-600/40 flex items-center justify-center shrink-0 text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                Sportello Ufficiale Iscrizione NIN &amp; BVN Nigeria a Messina
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Rilevazione dati biometrici direttamente in Via Ugo Bassi 104, senza dover viaggiare a Roma.
            </p>
          </div>
        </div>

        {/* Right Action Button */}
        <button
          onClick={onOpenBiometrics}
          className="px-5 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs shrink-0 active:scale-[0.98] cursor-pointer"
        >
          Prenota Appuntamento
        </button>

      </div>
    </section>
  );
};
