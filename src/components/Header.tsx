import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Phone, 
  X, 
  Menu 
} from 'lucide-react';
import { StoreSettings } from '../types';

interface HeaderProps {
  settings: StoreSettings;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin?: () => void;
  onOpenBiometrics: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onOpenBiometrics,
  searchQuery,
  onSearchChange,
  onNavigateSection
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileHeaderVisible, setMobileHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const prevScrollY = lastScrollYRef.current;
          const delta = currentScrollY - prevScrollY;

          // Always visible near top of page
          if (currentScrollY <= 20) {
            setMobileHeaderVisible(true);
          } else if (delta > 8) {
            // Scrolling down -> hide header in mobile mode
            setMobileHeaderVisible(false);
          } else if (delta < -8) {
            // Scrolling up -> show header again in mobile mode
            setMobileHeaderVisible(true);
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs transition-transform duration-300 ease-in-out will-change-transform ${
        !mobileHeaderVisible && !mobileMenuOpen ? '-translate-y-full lg:translate-y-0' : 'translate-y-0'
      }`}
    >
      {/* 1. Yellow Announcement Bar (matching screenshot top amber strip) */}
      {settings.announcementActive && (
        <div className="bg-[#f59e0b] text-[#1c1917] text-xs sm:text-[13px] font-semibold py-1.5 px-4 text-center tracking-tight flex items-center justify-center gap-2">
          <span>{settings.announcement}</span>
        </div>
      )}

      {/* 2. Top Dark Green Info Strip */}
      <div className="bg-[#124b2e] text-emerald-50 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] sm:text-xs">
            <span className="font-medium text-emerald-200">
              Lun–Sab: {settings.hoursMonSat.split(' ')[0]}–{settings.hoursMonSat.split(' ')[3]} · Dom: {settings.hoursSun.split(' ')[0]}–{settings.hoursSun.split(' ')[3]}
            </span>
            <span className="text-emerald-400 hidden md:inline">·</span>
            <span className="hidden md:inline text-emerald-200">
              Via Ugo Bassi 104, Messina
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <a 
              href={`tel:${settings.phone1.replace(/\s+/g, '')}`} 
              className="flex items-center gap-1 font-medium hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 text-emerald-300" />
              <span>{settings.phone1}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Main Brand & Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="cursor-pointer group select-none"
          >
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif-display font-extrabold text-2xl sm:text-[28px] tracking-tight text-[#124b2e] leading-none group-hover:text-emerald-900 transition-colors">
                MAMA SAM
              </span>
            </div>
            <p className="text-[9.5px] sm:text-[10px] font-bold tracking-[0.16em] text-[#1e293b] uppercase mt-0.5">
              Supermercato Africano &amp; Caraibico
            </p>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-700">
            <button 
              onClick={() => onNavigateSection('special-offers-section')}
              className="hover:text-rose-600 text-rose-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              Offerte
            </button>
            <button 
              onClick={() => onNavigateSection('new-arrivals-section')}
              className="hover:text-[#124b2e] text-emerald-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Nuovi Arrivi
            </button>
            <button 
              onClick={() => onNavigateSection('products-section')}
              className="hover:text-[#124b2e] transition-colors cursor-pointer"
            >
              Alimentari
            </button>
            <button 
              onClick={() => onNavigateSection('categories-section')}
              className="hover:text-[#124b2e] transition-colors cursor-pointer"
            >
              Categorie
            </button>
            <button 
              onClick={() => onNavigateSection('recipes-section')}
              className="hover:text-[#124b2e] transition-colors cursor-pointer"
            >
              Ricette
            </button>
            <button 
              onClick={onOpenBiometrics}
              className="hover:text-[#124b2e] text-[#124b2e] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Sportello NIN &amp; BVN
            </button>
            <button 
              onClick={() => onNavigateSection('location-section')}
              className="hover:text-[#124b2e] transition-colors cursor-pointer"
            >
              Dove Siamo
            </button>
            <button 
              onClick={() => onNavigateSection('reviews-section')}
              className="hover:text-[#124b2e] transition-colors cursor-pointer"
            >
              Recensioni
            </button>
          </nav>

          {/* Right Action Island: Shopping Bag */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#124b2e] hover:bg-[#0e3b24] text-white rounded-lg font-medium text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              <span className="font-semibold">{cartCount} {cartCount === 1 ? 'Articolo' : 'Articoli'}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200"
              aria-label="Menu di navigazione"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* 4. Search Bar (Full Width under Nav) */}
        <div className="mt-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cerca yam, platani, garri, olio di palma, carne di capra, zobo..."
              className="w-full pl-10 pr-9 py-2 bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-xs sm:text-sm border border-stone-200 focus:border-[#124b2e] rounded-lg outline-hidden text-slate-900 transition-colors shadow-2xs placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Cancella ricerca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2.5 text-sm font-medium text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
            <button 
              onClick={() => { onNavigateSection('special-offers-section'); setMobileMenuOpen(false); }}
              className="text-left py-1.5 text-rose-700 font-semibold flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Offerte Speciali
            </button>
            <button 
              onClick={() => { onNavigateSection('new-arrivals-section'); setMobileMenuOpen(false); }}
              className="text-left py-1.5 text-emerald-800 font-semibold flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Nuovi Arrivi
            </button>
            <button 
              onClick={() => { onNavigateSection('products-section'); setMobileMenuOpen(false); }}
              className="text-left py-1.5 hover:text-[#124b2e]"
            >
              Alimentari
            </button>
            <button 
              onClick={() => { onNavigateSection('categories-section'); setMobileMenuOpen(false); }}
              className="text-left py-1.5 hover:text-[#124b2e]"
            >
              Categorie
            </button>
            <button 
              onClick={() => { onNavigateSection('recipes-section'); setMobileMenuOpen(false); }}
              className="text-left py-1.5 hover:text-[#124b2e]"
            >
              Ricette
            </button>
            <button 
              onClick={() => { onOpenBiometrics(); setMobileMenuOpen(false); }}
              className="text-left py-1.5 text-[#124b2e] font-semibold flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Sportello Ufficiale NIN &amp; BVN
            </button>
            <button 
              onClick={() => { onNavigateSection('location-section'); setMobileMenuOpen(false); }}
              className="text-left py-1.5 hover:text-[#124b2e]"
            >
              Dove Siamo a Messina
            </button>
            <button 
              onClick={() => { onNavigateSection('reviews-section'); setMobileMenuOpen(false); }}
              className="text-left py-1.5 hover:text-[#124b2e]"
            >
              Recensioni dei Clienti
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
