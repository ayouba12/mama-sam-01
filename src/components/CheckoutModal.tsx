import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  Phone, 
  MessageCircle, 
  CreditCard,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Info
} from 'lucide-react';
import { CartItem, Order, StoreSettings } from '../types';
import { getContainsList, getMayContainList, hasAllergenWarnings } from '../utils/allergenHelper';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StoreSettings;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onOrderSuccess
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [pickupTimePreference, setPickupTimePreference] = useState('In circa 30 minuti');
  const [customerNote, setCustomerNote] = useState('');
  const [allergenAcknowledged, setAllergenAcknowledged] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const subtotal = Number(
    items.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Inserisci il tuo nome completo e un recapito telefonico.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName,
        customerPhone,
        customerEmail,
        pickupTimePreference,
        customerNote,
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invio dell\'ordine non riuscito. Verifica la disponibilità.');
      }

      setCompletedOrder(data.order);
      onOrderSuccess(data.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!completedOrder) return;
    const itemList = completedOrder.items
      .map(i => `• ${i.quantity}x ${i.productName} (${i.packageSize}) - €${i.lineTotal.toFixed(2)}`)
      .join('\n');

    const msg = `Ciao Mama Sam! Ho appena effettuato un ordine per il ritiro in negozio:\n\n*Rif. Ordine:* ${completedOrder.orderNumber}\n*Cliente:* ${completedOrder.customerName}\n*Telefono:* ${completedOrder.customerPhone}\n*Orario Ritiro:* ${completedOrder.pickupTimePreference}\n\n*Prodotti Ordinati:*\n${itemList}\n\n*Totale:* €${completedOrder.total.toFixed(2)}\n*Punto di Ritiro:* Via Ugo Bassi 104, Messina\n${completedOrder.customerNote ? `*Note:* ${completedOrder.customerNote}` : ''}`;

    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto animate-fade-fast">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 my-auto sm:my-8 animate-slide-up-mobile will-change-transform">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">
              {completedOrder ? 'Ordine Confermato!' : 'Ritiro in Negozio'}
            </h3>
            <p className="text-xs text-slate-500">
              {completedOrder
                ? 'Il tuo codice ordine è stato riservato per il ritiro'
                : 'Ritiro in Via Ugo Bassi 104, Messina (Pagamento al ritiro)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {completedOrder ? (
            /* Order Success View */
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-[#124b2e] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-widest text-emerald-800 uppercase">
                  Ordine Inviato con Successo
                </span>
                <h4 className="font-mono text-2xl font-extrabold text-slate-900 mt-1">
                  {completedOrder.orderNumber}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Pronto per il ritiro: <strong>{completedOrder.pickupTimePreference}</strong>
                </p>
              </div>

              {/* Order items recap */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-left text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-800 pb-1.5 border-b border-stone-200">
                  <span>Articoli Ordinati ({completedOrder.items.length})</span>
                  <span>€{completedOrder.total.toFixed(2)}</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-stone-100">
                  {completedOrder.items.map((it, idx) => (
                    <div key={idx} className="pt-1.5 flex justify-between text-slate-600">
                      <span>{it.quantity}x {it.productName}</span>
                      <span className="font-medium text-slate-900">€{it.lineTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collection location reminder */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/70 text-left text-xs text-emerald-950 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Punto di Ritiro in Negozio:</strong>
                  <p>{settings.address}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Pagamento al ritiro tramite Contanti, Carte o Satispay.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full py-3 px-4 bg-[#128c7e] hover:bg-[#075e54] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Invia Dettagli Ordine a Mama Sam su WhatsApp</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Torna al Negozio
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Store Pickup Notice */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Ritiro: Via Ugo Bassi 104, Messina</span>
                </div>
                <span className="font-bold text-emerald-700">RITIRO GRATUITO</span>
              </div>

              {/* Order Items Breakdown & Allergen Warnings */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-800 pb-1.5 border-b border-stone-200">
                  <span>Prodotti Selezionati ({items.reduce((s, it) => s + it.quantity, 0)})</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 divide-y divide-stone-100 pr-1">
                  {items.map(item => {
                    const contains = getContainsList(item.product.dietaryInfo);
                    const mayContain = getMayContainList(item.product.dietaryInfo);
                    return (
                      <div key={item.product.id} className="pt-2 text-slate-700 first:pt-0">
                        <div className="flex justify-between font-semibold text-slate-900">
                          <span className="truncate pr-2">{item.quantity}x {item.product.name}</span>
                          <span className="shrink-0">€{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {/* Specific Allergen Warnings beside this item */}
                        {contains.length > 0 && (
                          <div className="mt-1 flex items-start gap-1 text-[11px] text-rose-800 bg-rose-50 p-1.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                            <span><strong>Contiene:</strong> {contains.map(c => c.displayLabel).join(', ')}</span>
                          </div>
                        )}
                        {mayContain.length > 0 && (
                          <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                            <Info className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Può contenere:</strong> {mayContain.map(c => c.displayLabel).join(', ')}</span>
                          </div>
                        )}
                        {!contains.length && !mayContain.length && item.product.allergenInfo && (
                          <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                            <span>{item.product.allergenInfo}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Allergen & Packaging Safety Advisory */}
              {items.some(it => hasAllergenWarnings(it.product.dietaryInfo) || Boolean(it.product.allergenInfo)) && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Promemoria Confezione e Allergeni:</strong>
                      <p className="text-[11px] text-amber-900 leading-snug">
                        Gli ingredienti e le avvertenze riportate sulla confezione fisica del prodotto prevalgono sulle schede del sito. Si prega di verificare la confezione al momento del ritiro.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-1.5 border-t border-amber-200/80 cursor-pointer text-[11px] text-amber-950">
                    <input
                      type="checkbox"
                      checked={allergenAcknowledged}
                      onChange={e => setAllergenAcknowledged(e.target.checked)}
                      className="rounded border-amber-300 text-[#124b2e] focus:ring-[#124b2e]"
                    />
                    <span>Ho compreso e verificherò le etichette sulle confezioni al ritiro in negozio.</span>
                  </label>
                </div>
              )}

              {/* Customer Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome e Cognome *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. Mario Rossi o Blessing Adeleke"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-xl focus:border-[#124b2e] outline-hidden"
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cellulare / WhatsApp * (per conferma del ritiro)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="es. +39 351 000 0000"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-xl focus:border-[#124b2e] outline-hidden"
                />
              </div>

              {/* Customer Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Indirizzo Email (facoltativo)
                </label>
                <input
                  type="email"
                  placeholder="tua.email@esempio.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-xl focus:border-[#124b2e] outline-hidden"
                />
              </div>

              {/* Pickup Time Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Orario Stimato di Ritiro
                </label>
                <select
                  value={pickupTimePreference}
                  onChange={e => setPickupTimePreference(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white focus:border-[#124b2e] outline-hidden cursor-pointer"
                >
                  <option value="In circa 30 minuti">In circa 30 minuti (Più rapido)</option>
                  <option value="Oggi nel pomeriggio">Oggi nel pomeriggio</option>
                  <option value="Oggi in serata (prima delle 20:30)">Oggi in serata (prima delle 20:30)</option>
                  <option value="Domani mattina">Domani mattina</option>
                  <option value="Altro orario">Altro orario (specifica nelle note)</option>
                </select>
              </div>

              {/* Customer Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note o richieste per il negozio (facoltativo)
                </label>
                <textarea
                  rows={2}
                  placeholder="es. Preferisco platani molto maturi, oppure chiamatemi appena pronto."
                  value={customerNote}
                  onChange={e => setCustomerNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-xl focus:border-[#124b2e] outline-hidden"
                />
              </div>

              {/* Order total & payment policy */}
              <div className="pt-2 border-t border-stone-200">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-slate-600 font-medium">Totale Articoli ({items.length} prodotti):</span>
                  <span className="font-extrabold text-lg text-slate-900">€{subtotal.toFixed(2)}</span>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-snug mb-4 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  💳 <strong>Pagamento al Ritiro:</strong> Pagherai comodamente al momento del ritiro presso Mama Sam con Contanti, Carta o Satispay.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#124b2e] hover:bg-[#0e3b24] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Invio dell\'ordine in corso...' : `Conferma Ordine per il Ritiro (€${subtotal.toFixed(2)})`}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
