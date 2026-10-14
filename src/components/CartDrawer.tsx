import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, MapPin, Clock, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { CartItem } from '../types';
import { resolveImage } from '../utils/imageHelper';
import { getContainsList, getMayContainList, hasAllergenWarnings } from '../utils/allergenHelper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout
}) => {
  if (!isOpen) return null;

  const subtotal = Number(
    items.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)
  );
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-2xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#124b2e]" />
              <h3 className="font-bold text-base text-slate-900">
                Il Tuo Carrello ({totalCount})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-stone-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-1">Il tuo carrello è vuoto</h4>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Aggiungi yam ghanesi, garri ijebu, platani maturi o spezie tradizionali per iniziare.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#124b2e] text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Inizia gli Acquisti
                </button>
              </div>
            ) : (
              items.map((item) => {
                const lineTotal = (item.product.price * item.quantity).toFixed(2);
                return (
                  <div key={item.product.id} className="py-3.5 flex gap-3">
                    <img
                      src={resolveImage(item.product.image)}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xl border border-stone-200 bg-stone-50 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-snug truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                          title="Rimuovi articolo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 mb-1.5">
                        {item.product.packageSize} · €{item.product.price.toFixed(2)} cad.
                      </p>

                      {/* Product-Specific Allergen Warnings */}
                      {(() => {
                        const contains = getContainsList(item.product.dietaryInfo);
                        const mayContain = getMayContainList(item.product.dietaryInfo);
                        if (contains.length > 0) {
                          return (
                            <div className="mb-2 p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[10.5px] text-rose-900 flex items-start gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                              <span><strong>Contiene:</strong> {contains.map(c => c.displayLabel).join(', ')}</span>
                            </div>
                          );
                        }
                        if (mayContain.length > 0) {
                          return (
                            <div className="mb-2 p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10.5px] text-amber-900 flex items-start gap-1.5">
                              <Info className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                              <span><strong>Può contenere:</strong> {mayContain.map(c => c.displayLabel).join(', ')}</span>
                            </div>
                          );
                        }
                        if (item.product.allergenInfo) {
                          return (
                            <div className="mb-2 p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10.5px] text-amber-900 flex items-start gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                              <span>{item.product.allergenInfo}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="flex items-center justify-between">
                        {/* Stepper */}
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-stone-200 text-slate-600 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-slate-800 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-stone-200 text-slate-600 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          €{lineTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/70 space-y-3">
              {/* Pickup Reassurance Box */}
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11.5px] text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Ritiro in Via Ugo Bassi 104 (~30 min)</span>
                </div>
                <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">
                  GRATIS
                </span>
              </div>

              {/* Allergen Bag Advisory Notice */}
              {items.some(it => hasAllergenWarnings(it.product.dietaryInfo) || Boolean(it.product.allergenInfo)) && (
                <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Avviso di Sicurezza Allergeni:</strong> Alcuni prodotti nel tuo ordine contengono avvisi per allergeni. Si prega di verificare l'etichetta al ritiro in negozio.
                  </div>
                </div>
              )}

              {/* Subtotal */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-slate-600 font-medium">Totale Stimato:</span>
                <span className="font-extrabold text-xl text-slate-900">
                  €{subtotal.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-3 px-4 bg-[#124b2e] hover:bg-[#0e3b24] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Procedi all'Ordine</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Nessun pagamento anticipato online: paghi al ritiro</span>
                <button
                  onClick={onClearCart}
                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Svuota carrello
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
