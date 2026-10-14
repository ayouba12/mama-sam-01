import React from 'react';
import { ShoppingBag, ShieldCheck, CreditCard } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const cards = [
    {
      icon: ShoppingBag,
      title: 'Ritiro in Negozio',
      subtitle: 'Pronto entro ~30 minuti'
    },
    {
      icon: ShieldCheck,
      title: 'Importazioni Autentiche',
      subtitle: 'Prodotti originali da Africa Occidentale e Caraibi'
    },
    {
      icon: CreditCard,
      title: 'Paga al Ritiro',
      subtitle: 'Contanti, carte e contactless accettati'
    }
  ];

  return (
    <section className="bg-stone-50/80 border-b border-stone-200/80 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div 
                key={index}
                className="bg-white py-3 px-4 rounded-xl border border-stone-200/90 shadow-2xs flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#124b2e] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
