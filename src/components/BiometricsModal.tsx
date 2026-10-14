import React from 'react';
import { X, ShieldCheck, MapPin, Calendar, Clock, Phone, MessageCircle, FileText } from 'lucide-react';
import { StoreSettings } from '../types';

interface BiometricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

export const BiometricsModal: React.FC<BiometricsModalProps> = ({
  isOpen,
  onClose,
  settings
}) => {
  if (!isOpen) return null;

  const handleBookWhatsApp = () => {
    const text = encodeURIComponent(
      'Ciao Mama Sam! Vorrei prenotare un appuntamento per la registrazione biometrica NIN / BVN nigeriana in Via Ugo Bassi 104 a Messina.'
    );
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 my-8">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-[#0b3b22] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Sportello Ufficiale Iscrizione NIN &amp; BVN
              </h3>
              <p className="text-xs text-emerald-300/80">Servizio Biometrico Autorizzato a Messina, Sicilia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-xs sm:text-[13px] text-slate-600">
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-950 leading-relaxed">
            <p className="font-semibold mb-1 text-emerald-900">
              Non c'è più bisogno di viaggiare fino a Roma o Milano per i servizi biometrici nigeriani!
            </p>
            <p className="text-xs text-emerald-850">
              Mama Sam Mini Supermarket ospita un centro autorizzato direttamente in Via Ugo Bassi 104 a Messina al servizio della comunità nigeriana in tutta la Sicilia e il Sud Italia.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Servizi Biometrici Disponibili:
            </h4>
            <ul className="space-y-1.5 pl-4 list-disc text-slate-700">
              <li><strong>Nuova Iscrizione NIN:</strong> Registrazione del National Identification Number e rilascio attestato.</li>
              <li><strong>Modifiche NIN:</strong> Cambio nome, data di nascita, indirizzo o recapito telefonico.</li>
              <li><strong>Registrazione BVN:</strong> Rilevazione del Bank Verification Number per i conti bancari in Nigeria.</li>
              <li><strong>Validazione Biometrica:</strong> Verifica per rinnovo passaporto nigeriano.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Cosa Portare all'Appuntamento:
            </h4>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-slate-600">
              <p className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Passaporto Nigeriano originale o copia valida (oppure Permesso di Soggiorno)</span>
              </p>
              <p className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Certificato di nascita o dichiarazione di età (per minori o nuove registrazioni)</span>
              </p>
              <p className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Numero di telefono attivo e indirizzo email per ricevere gli SMS di verifica</span>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center gap-2 text-slate-800 font-semibold mb-1">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Sede: {settings.address}</span>
            </div>
            <p className="text-slate-500 text-xs pl-6">
              Lun–Sab: 10:00 - 18:00 (Su appuntamento o con fila sul posto)
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={handleBookWhatsApp}
              className="w-full py-3 px-4 bg-[#128c7e] hover:bg-[#075e54] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Prenota Appuntamento su WhatsApp ({settings.phone1})</span>
            </button>

            <a
              href={`tel:${settings.phone1.replace(/\s+/g, '')}`}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Chiama il Coordinatore Sportello</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
