import React from 'react';
import { MapPin, Phone, Mail, ShieldCheck, MessageCircle, Bell } from 'lucide-react';
import { StoreSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  settings: StoreSettings;
  onOpenAdmin?: () => void;
  onSelectCategory: (cat: string) => void;
  onOpenBiometrics: () => void;
  onWhatsAppOrder: () => void;
  onOpenAllergenInfo?: () => void;
  onOpenLegalNotice?: () => void;
  onOpenNotifications?: () => void;
  canInstallPWA?: boolean;
  onInstallPWA?: () => Promise<boolean>;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenAdmin,
  onSelectCategory,
  onOpenBiometrics,
  onWhatsAppOrder,
  onOpenAllergenInfo,
  onOpenLegalNotice,
  onOpenNotifications,
  canInstallPWA = false,
  onInstallPWA
}) => {
  return (
    <footer className="bg-[#111827] text-slate-300 text-xs pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* 4 Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          
          {/* Column 1: Store Bio */}
          <div>
            <div className="mb-3">
              <span className="font-serif-display font-extrabold text-xl text-white tracking-tight">
                MAMA SAM
              </span>
              <p className="text-[9.5px] font-bold tracking-[0.16em] text-emerald-400 uppercase mt-0.5">
                Supermercato Africano &amp; Caraibico
              </p>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Il tuo negozio di alimentari a Messina per prodotti africani e caraibici autentici, tuberi tropicali, farine, olio di palma, cosmetici e servizi per la comunità.
            </p>

            <div className="space-y-1.5 text-[11.5px] text-slate-400">
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{settings.phone1} / {settings.phone2}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{settings.email}</span>
              </p>
            </div>
          </div>

          {/* Column 2: Popular Aisles */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-3.5">
              Corsie Principali
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => onSelectCategory('Farine e amidi')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Farina di Platano, Fufu &amp; Gari
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Condimenti e dadi')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Condimenti, Dadi Maggi &amp; Brodi
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Noodles e pasta')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Noodles Istantanei &amp; Spaghetti
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Carne e pesce in scatola')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Sardine, Tonno &amp; Corned Beef
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Oli e grassi')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Olio di Palma &amp; Oli Vegetali
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Cura dei capelli')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Oli &amp; Cosmetici Afro per Capelli
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Services & Hours */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-3.5">
              Servizi &amp; Orari
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={onOpenBiometrics}
                  className="text-emerald-300 font-semibold hover:text-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Sportello Iscrizione NIN &amp; BVN
                </button>
              </li>
              <li className="text-slate-300 font-medium">Ritiro pronto in ~30 min</li>
              <li className="text-slate-400 pt-1">
                <span className="text-white block font-medium">Lun - Sab:</span> {settings.hoursMonSat}
              </li>
              <li className="text-slate-400">
                <span className="text-white block font-medium">Domenica:</span> {settings.hoursSun}
              </li>
              {onOpenNotifications && (
                <li className="pt-1.5">
                  <button
                    type="button"
                    onClick={onOpenNotifications}
                    className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-semibold transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Avvisi Orari &amp; Nuovi Arrivi</span>
                  </button>
                </li>
              )}
              {onInstallPWA && canInstallPWA && (
                <li className="pt-1">
                  <PWAInstallButton canInstall={canInstallPWA} onInstall={onInstallPWA} variant="footer" />
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Payment & Security */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-3.5">
              Pagamenti &amp; Garanzie
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Paga comodamente al ritiro in negozio. Nessun pagamento anticipato richiesto online.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded font-medium border border-slate-700">
                Contanti al Ritiro
              </span>
              <span className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded font-medium border border-slate-700">
                Satispay
              </span>
              <span className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded font-medium border border-slate-700">
                Visa / Mastercard
              </span>
              <span className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded font-medium border border-slate-700">
                Postepay
              </span>
              <span className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded font-medium border border-slate-700">
                Bancomat
              </span>
            </div>

            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Freschezza e Origine Autentica</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            <p>© 2026 Mama Sam Supermercato Africano &amp; Caraibico, Messina, Italia.</p>
            <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
              P.IVA: [in attesa di inserimento] · REA Messina: [in attesa di inserimento]
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <a href="#products-section" className="hover:text-slate-300 transition-colors">Prodotti</a>
            <span>·</span>
            {onOpenAllergenInfo && (
              <>
                <button
                  type="button"
                  onClick={onOpenAllergenInfo}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
                >
                  Informativa Allergeni
                </button>
                <span>·</span>
              </>
            )}
            <a href="#location-section" className="hover:text-slate-300 transition-colors">Dove Siamo</a>
            <span>·</span>
            <a href="#reviews-section" className="hover:text-slate-300 transition-colors">Recensioni</a>
            {onOpenLegalNotice && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={onOpenLegalNotice}
                  className="text-slate-400 hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                >
                  Note Legali &amp; Privacy
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Floating WhatsApp Action at Bottom Right */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={onWhatsAppOrder}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#128c7e] hover:bg-[#075e54] text-white font-bold text-xs rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer border-2 border-white/30"
          title="Scrivi al banco Mama Sam su WhatsApp"
        >
          <MessageCircle className="w-4 h-4 text-white" />
          <span>Ordina su WhatsApp</span>
        </button>
      </div>
    </footer>
  );
};
