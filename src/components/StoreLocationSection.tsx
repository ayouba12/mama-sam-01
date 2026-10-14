import React from 'react';
import { MapPin, Clock, Phone, Mail, Navigation, ExternalLink } from 'lucide-react';
import { IMAGES } from '../assets/images';
import { StoreSettings } from '../types';

interface StoreLocationSectionProps {
  settings: StoreSettings;
}

export const StoreLocationSection: React.FC<StoreLocationSectionProps> = ({ settings }) => {
  return (
    <section id="location-section" className="py-12 sm:py-16 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Store Details & Pickup Info */}
          <div className="lg:col-span-7">
            <span className="text-[11px] font-bold tracking-[0.14em] text-emerald-800 uppercase block mb-1">
              Dove Siamo
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Vieni a Trovarci a Messina
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Situato in Via Ugo Bassi, il nostro negozio offre prodotti tropicali freschi, spezie autentiche, pesce affumicato, farine e cosmetici. Ritira i tuoi ordini online confezionati con cura in circa 30 minuti.
            </p>

            {/* Address Box */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/90 mb-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-emerald-800" />
              </div>
              <div className="text-xs sm:text-[13px]">
                <strong className="block text-slate-900 font-bold mb-0.5">Indirizzo del Negozio</strong>
                <p className="text-slate-600">{settings.address}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Plus Code Google Maps: 54PM+X8 Messina, Città Metropolitana di Messina
                </p>
              </div>
            </div>

            {/* Schedule & Contact in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Orari di Apertura</span>
                </div>
                <p className="text-slate-600">
                  <strong className="text-slate-700">Lun - Sab:</strong> {settings.hoursMonSat}
                </p>
                <p className="text-slate-600 mt-0.5">
                  <strong className="text-slate-700">Domenica:</strong> {settings.hoursSun}
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Contatti &amp; Telefono</span>
                </div>
                <p className="text-slate-600">
                  {settings.phone1} / {settings.phone2}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{settings.email}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#124b2e] hover:bg-[#0e3b24] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                <Navigation className="w-4 h-4 text-emerald-300" />
                <span>Indicazioni Google Maps</span>
              </a>

              <a
                href={`tel:${settings.phone1.replace(/\s+/g, '')}`}
                className="px-5 py-2.5 border border-stone-300 hover:border-emerald-600 text-slate-800 hover:text-[#124b2e] font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>Chiama Negozio</span>
              </a>
            </div>

          </div>

          {/* Right Column: Messina Physical Storefront Image */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-stone-200 bg-stone-100 group">
              <img
                src={IMAGES.storefrontShop}
                alt="Mama Sam Supermercato Africano e Caraibico a Messina"
                className="w-full h-auto aspect-[4/3] object-cover object-center group-hover:scale-102 transition-transform duration-500"
              />
              
              {/* Caption Overlay */}
              <div className="p-4 bg-white border-t border-stone-200">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                  Posizione Centrale a Messina
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Situato a pochi passi dalla linea del tram e da Viale San Martino. Facile da raggiungere a piedi da Piazza Cairoli e comodo per soste brevi.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
