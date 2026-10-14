import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Come funziona il ritiro in negozio da Mama Sam?',
      a: 'Aggiungi semplicemente i prodotti che desideri al carrello, invia l\'ordine e il nostro personale preparerà la tua spesa fresca in circa 30 minuti presso il nostro negozio in Via Ugo Bassi 104. Il ritiro in sede è sempre gratuito e non richiede un importo minimo di spesa.'
    },
    {
      q: 'Dove si trova il negozio e quali sono gli orari di apertura?',
      a: 'Ci troviamo in Via Ugo Bassi 104 (Isolato 147), 98123 Messina, nelle immediate vicinanze di Viale San Martino e della linea del tram. Siamo aperti dal lunedì al sabato dalle 8:00 alle 20:30 (orario continuato), e la domenica dalle 10:00 alle 16:00.'
    },
    {
      q: 'Posso ordinare direttamente tramite WhatsApp?',
      a: 'Certamente! Puoi sfogliare il catalogo sul sito, aggiungere gli articoli al carrello e cliccare su "Ordina su WhatsApp": verrà composto automaticamente un messaggio con il riepilogo dei prodotti e l\'orario desiderato, inviato direttamente al nostro banco (+39 351 290 1397).'
    },
    {
      q: 'Quali metodi di pagamento sono accettati al momento del ritiro?',
      a: 'Paghi comodamente al ritiro in negozio. Accettiamo contanti, bancomat, Visa, Mastercard, Postepay e Satispay. Non è richiesto alcun inserimento di carta o addebito anticipato online.'
    },
    {
      q: 'Come funziona lo sportello biometrico NIN & BVN della Nigeria?',
      a: 'Mama Sam ospita un centro autorizzato per i cittadini nigeriani residenti in Sicilia e nel Sud Italia. È possibile effettuare la registrazione o l\'aggiornamento del National Identification Number (NIN) e del Bank Verification Number (BVN) direttamente a Messina, senza doversi recare all\'Ambasciata di Roma. Gli appuntamenti si possono prenotare in sede o su WhatsApp.'
    }
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-12 sm:py-16 bg-[#faf9f5] border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-[11px] font-bold tracking-[0.14em] text-emerald-800 uppercase block mb-1">
            Domande &amp; Informazioni
          </span>
          <h2 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Domande Frequenti
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-lg mx-auto">
            Tutto quello che c'è da sapere sul ritiro in negozio, gli ordini, i metodi di pagamento e i servizi per la comunità a Messina.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 hover:text-[#124b2e] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-[13px] text-slate-600 leading-relaxed border-t border-stone-100">
                    <p className="pt-2">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
