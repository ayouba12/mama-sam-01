import React, { useEffect } from 'react';
import { X, ShieldCheck, FileText, Info } from 'lucide-react';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#124b2e] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 id="legal-modal-title" className="font-bold text-base text-slate-900">
                Note Legali, Trasparenza &amp; Privacy
              </h3>
              <p className="text-[11px] text-slate-500">
                Informativa ai sensi del D.Lgs. 70/2003 e del Regolamento UE 2016/679 (GDPR)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-200/60 transition-colors"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto text-xs text-slate-700 space-y-5 leading-relaxed">
          {/* Statutory Business Details */}
          <div className="space-y-2 pb-4 border-b border-stone-200">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Dati Societari e Informazioni Obbligatorie</span>
            </h4>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5 font-mono text-[11px] text-slate-800">
              <p><strong>Insegna Negozio:</strong> Mama Sam Supermercato Africano &amp; Caraibico</p>
              <p><strong>Denominazione / Ragione Sociale:</strong> [Ragione Sociale da specificare - Ditta Individuale / Società]</p>
              <p><strong>Sede Operativa e Punto Ritiro:</strong> Via Ugo Bassi 104, Isolato 147, 98123 Messina (ME), Italia</p>
              <p><strong>Partita IVA:</strong> [Partita IVA da inserire - es. IT00000000000]</p>
              <p><strong>Iscrizione Camera di Commercio / REA:</strong> [Numero REA Messina da inserire]</p>
              <p><strong>Recapiti Telefonici:</strong> +39 351 290 1397 / +39 351 206 2949</p>
              <p><strong>Email Ufficiale:</strong> mamasamafrican@gmail.com</p>
              <p><strong>Posta Elettronica Certificata (PEC):</strong> [Indirizzo PEC da inserire]</p>
            </div>
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              * I campi tra parentesi quadre indicano i dati societari da integrare a cura del titolare prima dell'attivazione commerciale definitiva.
            </p>
          </div>

          {/* Privacy & Order Data Handling */}
          <div className="space-y-2 pb-4 border-b border-stone-200">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>Informativa sul Trattamento dei Dati Personali (Privacy)</span>
            </h4>
            <p>
              I dati personali forniti volontariamente dai clienti in fase di ordinazione (nome, recapito telefonico, indirizzo email facoltativo, orario stimato di arrivo ed eventuali note alimentari) sono trattati da <strong>Mama Sam</strong> nel pieno rispetto del Regolamento Generale sulla Protezione dei Dati (Regolamento UE 2016/679 - GDPR).
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Finalità esclusiva:</strong> I dati raccolti sono utilizzati unicamente per elaborare la spesa, verificare la disponibilità delle scorte e contattare il cliente per la consegna al banco in Via Ugo Bassi 104.</li>
              <li><strong>Nessuna cessione a terzi:</strong> I tuoi dati non vengono ceduti a terze parti né utilizzati per finalità di marketing non richieste o profilazione commerciale.</li>
              <li><strong>Conservazione:</strong> Le informazioni dell'ordine rimangono archiviate nel sistema locale per il tempo strettamente necessario all'evasione e agli obblighi contabili.</li>
              <li><strong>Diritti dell'interessato:</strong> Il cliente può in qualsiasi momento richiedere la verifica, modifica o cancellazione dei propri dati contattando il negozio via email all'indirizzo <em>mamasamafrican@gmail.com</em> o direttamente in sede.</li>
            </ul>
          </div>

          {/* In-Store Pickup & Consumer Rights */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900">
              Condizioni del Servizio di Ritiro (Click &amp; Collect)
            </h4>
            <p>
              Il nostro sito offre un servizio di prenotazione con <strong>ritiro e pagamento esclusivo presso il nostro punto vendita fisico</strong> a Messina.
            </p>
            <p className="text-slate-600">
              Nessun pagamento o addebito anticipato viene richiesto online. Il cliente verifica l'integrità, il peso e la freschezza degli alimenti (inclusi tuberi freschi, farine, pesce e prodotti deperibili) direttamente al momento della consegna in negozio, saldando l'importo tramite contanti, bancomat, carte o Satispay.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#124b2e] hover:bg-[#0e3b24] text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Ho compreso
          </button>
        </div>
      </div>
    </div>
  );
};
