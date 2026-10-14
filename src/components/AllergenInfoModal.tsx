import React from 'react';
import { X, AlertCircle, ShieldAlert, CheckCircle, FileText, Phone, ExternalLink } from 'lucide-react';
import { EU_ALLERGENS } from '../utils/allergenHelper';
import { StoreSettings } from '../types';

interface AllergenInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

export const AllergenInfoModal: React.FC<AllergenInfoModalProps> = ({
  isOpen,
  onClose,
  settings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                Informativa su Allergeni e Ingredienti
              </h3>
              <p className="text-xs text-slate-500">
                Conformità al Regolamento UE n. 1169/2011 sulle informazioni alimentari per i consumatori
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          {/* Main Notice Box */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-amber-950 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Linee Guida Importanti per Clienti con Allergie o Intolleranze</span>
            </div>
            <p>
              Mama Sam prende molto sul serio la sicurezza alimentare e la trasparenza sugli allergeni. Poiché molti dei nostri autentici prodotti africani e caraibici sono importati direttamente da produttori artigianali e cooperative internazionali, le formulazioni e gli imballaggi possono subire variazioni.
            </p>
          </div>

          {/* Key Consumer Principles */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#124b2e]" />
              <span>Linee Guida di Verifica per il Cliente</span>
            </h4>
            
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Prevalenza dell'Etichetta Fisica:</strong> Leggere sempre l'elenco degli ingredienti e le avvertenze presenti sulla confezione fisica al momento del ritiro. La confezione fisica riflette il lotto esatto ricevuto e prevale sempre sulle descrizioni online.
                </span>
              </li>

              <li className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Variazioni di Formulazione:</strong> I produttori e i mulini possono aggiornare le ricette degli ingredienti o modificare gli stabilimenti di lavorazione senza preavviso.
                </span>
              </li>

              <li className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Contaminazione Crociata:</strong> Segnaliamo gli avvisi di lavorazione comunicati dai fornitori (es. mulini condivisi o linee di confezionamento comuni). Se non dichiarato esplicitamente, non consideriamo il prodotto privo di allergeni.
                </span>
              </li>

              <li className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Allergie Gravi:</strong> In caso di allergie gravi o anafilassi, vi invitiamo a parlare con il responsabile del negozio prima di effettuare l'ordine, in modo da verificare di persona il lotto disponibile.
                </span>
              </li>
            </ul>
          </div>

          {/* 14 Regulated EU Allergens Overview */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              I 14 Allergeni Alimentari Regolamentati dall'UE
            </h4>
            <p className="text-[11px] text-slate-500">
              In conformità al Regolamento europeo sulle informazioni sugli alimenti (FIC):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {EU_ALLERGENS.map(a => (
                <div key={a.key} className="p-2 bg-stone-50 rounded-lg border border-stone-200 text-[11px]">
                  <strong className="block text-slate-900">{a.label}</strong>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{a.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Store Box */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
            <div>
              <p className="font-bold">Hai bisogno di chiarimenti immediati su un ingrediente?</p>
              <p className="text-emerald-800 text-[11px]">
                Chiama il nostro negozio a Messina al {settings.phone1} o chiedi direttamente al banco in Via Ugo Bassi 104.
              </p>
            </div>
            <a
              href={`tel:${settings.phone1.replace(/\s+/g, '')}`}
              className="px-3.5 py-1.5 bg-[#124b2e] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Chiama Negozio</span>
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Ho Capito
          </button>
        </div>

      </div>
    </div>
  );
};
