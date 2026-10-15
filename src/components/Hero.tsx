import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { IMAGES } from '../assets/images';
import { StoreSettings } from '../types';

interface HeroProps {
  settings: StoreSettings;
  onShopClick: () => void;
  onShopOffersClick?: () => void;
  onDiscoverNewClick?: () => void;
  onWhatsAppClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  onShopClick,
  onShopOffersClick,
  onDiscoverNewClick
}) => {
  return (
    <section className="relative pt-6 pb-10 sm:pt-10 sm:pb-14 bg-white border-b border-stone-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (Text & CTA) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Eyebrow */}
            <div className="mb-3">
              <span className="font-semibold text-xs sm:text-[13px] text-emerald-800 tracking-tight uppercase">
                Il Miglior Negozio Africano e Caraibico a Messina
              </span>
            </div>

            {/* Main Title */}
            <h1 className="font-serif-display text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-4">
              Spesa Africana e Caraibica Fresca, Pronta per il Ritiro.
            </h1>

            {/* Description */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
              Ordina online e ritira in circa 30 minuti presso il nostro negozio a Messina. Dagli autentici yam puna del Ghana e garri dorato all'olio di palma puro, pesce affumicato e platani freschi.
            </p>

            {/* Promotional & Primary CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-6">
              <button
                onClick={onShopClick}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#124b2e] hover:bg-[#0e3b24] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                Acquista Prodotti Freschi
              </button>

              <button
                onClick={onShopOffersClick || onShopClick}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-rose-50 hover:bg-rose-100/90 text-rose-800 border border-rose-200 font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Vedi le offerte speciali con sconti attivi"
              >
                <Flame className="w-4 h-4 text-rose-600 fill-rose-600" />
                <span>Acquista Offerte</span>
              </button>

              <button
                onClick={onDiscoverNewClick || onShopClick}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200 font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Scopri i nuovi prodotti appena arrivati"
              >
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Scopri Nuovi Prodotti</span>
              </button>
            </div>

            {/* Timing micro-bullets */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span className="font-medium text-slate-700">Preparato in ~30 min</span>
              <span className="text-slate-300">·</span>
              <span>Lun–Sab 8:00–20:30 | Dom 10:00–16:00</span>
              <span className="text-slate-300">·</span>
              <span>Contanti e Carte al ritiro</span>
            </div>

          </div>

          {/* Right Column: Hero Image with Floating Badge */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-stone-200 aspect-[4/3] lg:aspect-[4/3.2] bg-stone-100 group">
              <img
                src={IMAGES.heroShopkeeper}
                alt="Mama Sam Supermercato Africano e Caraibico a Messina"
                className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
              />
              
              {/* Subtle bottom gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Floating store badge */}
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-white/95 backdrop-blur-md p-3 rounded-xl border border-white/40 shadow-lg text-slate-800 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 leading-tight">Mama Sam Supermercato</h3>
                  <p className="text-[11px] text-slate-500">Punto Ritiro in Negozio</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase tracking-wider shrink-0">
                  Aperto Oggi
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
