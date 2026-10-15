import React, { useState } from 'react';
import { 
  X, Plus, Minus, Check, MapPin, ShieldCheck, 
  AlertTriangle, ShieldAlert, CheckCircle2, Leaf, Info, Calendar, Sparkles, Flame, Clock
} from 'lucide-react';
import { Product } from '../types';
import { resolveImage } from '../utils/imageHelper';
import { 
  getContainsList, 
  getMayContainList, 
  getVerifiedAbsentList, 
  getDietaryBadges 
} from '../utils/allergenHelper';
import { 
  isProductDiscountActive, 
  isProductNewArrival, 
  calculateDiscountPercentage,
  formatDateToItalian 
} from '../utils/promotionsHelper';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenAllergenPolicy?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onOpenAllergenPolicy
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  const dietary = product.dietaryInfo;
  const containsList = getContainsList(dietary);
  const mayContainList = getMayContainList(dietary);
  const absentList = getVerifiedAbsentList(dietary);
  const dietaryBadges = getDietaryBadges(dietary);
  const isVerified = dietary?.verificationStatus && dietary.verificationStatus !== 'unverified';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <span>{product.category}</span>
            <span>·</span>
            <span className="text-slate-600">{product.origin}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="aspect-square max-h-64 w-full rounded-xl overflow-hidden bg-stone-50 border border-stone-200 flex items-center justify-center relative">
            <img
              src={resolveImage(product.image)}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-1 pointer-events-none">
              {isProductNewArrival(product) ? (
                <span className="px-2 py-0.5 bg-[#124b2e] text-white text-[10px] font-bold rounded-md shadow-xs flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>Nuovo Arrivo</span>
                </span>
              ) : <div />}

              {isProductDiscountActive(product) && product.originalPrice && product.originalPrice > product.price && (
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[10.5px] font-extrabold rounded-md shadow-xs flex items-center gap-1 tracking-tight">
                  <Flame className="w-3 h-3 fill-white" />
                  <span>-{calculateDiscountPercentage(product.originalPrice, product.price)}% OFFERTA</span>
                </span>
              )}
            </div>

            {product.discountEndDate && isProductDiscountActive(product) && (
              <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium rounded-md shadow-xs flex items-center gap-1 pointer-events-none">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>Offerta valida fino al {formatDateToItalian(product.discountEndDate)}</span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                {product.name}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {product.packageSize} {product.subCategory && `· ${product.subCategory}`} {product.sku && `· SKU: ${product.sku}`}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            {product.description}
          </p>

          {/* INGREDIENTS STATEMENT */}
          {product.ingredients && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <strong className="block text-slate-900 font-bold mb-0.5">Ingredienti:</strong>
              <p className="text-slate-700 leading-relaxed">{product.ingredients}</p>
            </div>
          )}

          {/* ALLERGENS & DIETARY INFORMATION SECTION */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Allergeni e Informazioni Dietetiche</span>
              </div>
              {onOpenAllergenPolicy && (
                <button
                  type="button"
                  onClick={onOpenAllergenPolicy}
                  className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
                >
                  Informativa Allergeni
                </button>
              )}
            </div>

            {/* Unverified Warning if applicable */}
            {!isVerified ? (
              <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-lg text-xs text-amber-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Avviso di Verifica:</strong>
                  <p>
                    Le informazioni sugli allergeni non sono ancora state verificate per questo articolo. Si prega di verificare la confezione fisica o chiedere al personale del negozio prima dell'acquisto in caso di allergie.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Confirmed Present Allergens */}
            {containsList.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>CONTIENE (Ingrediente presente):</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {containsList.map(item => (
                    <span 
                      key={item.meta.key}
                      className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded-md text-[11px] shadow-2xs"
                    >
                      {item.displayLabel}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Possible Cross-Contact Allergens */}
            {mayContainList.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>PUÒ CONTENERE (Possibile contaminazione crociata):</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-snug">
                  Potenziale contaminazione crociata documentata nello stabilimento del produttore:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {mayContainList.map(item => (
                    <span 
                      key={item.meta.key}
                      className="px-2 py-0.5 bg-amber-200 text-amber-900 font-semibold rounded-md text-[11px] border border-amber-300"
                    >
                      {item.displayLabel}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specific Intolerance & Precautionary Warning Notes */}
            {(dietary?.intoleranceNotes || dietary?.warningNote || product.allergenInfo) && (
              <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-stone-200 space-y-1">
                {dietary?.intoleranceNotes && (
                  <p>
                    <strong className="text-slate-900 font-semibold">Informazioni su intolleranze:</strong> {dietary.intoleranceNotes}
                  </p>
                )}
                {dietary?.warningNote && (
                  <p>
                    <strong className="text-slate-900 font-semibold">Nota informativa:</strong> {dietary.warningNote}
                  </p>
                )}
                {!dietary?.warningNote && product.allergenInfo && (
                  <p>
                    <strong className="text-slate-900 font-semibold">Nota informativa:</strong> {product.allergenInfo}
                  </p>
                )}
              </div>
            )}

            {/* Verified Absent Allergens */}
            {absentList.length > 0 && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                <div className="flex items-center gap-1 font-semibold text-emerald-950 text-[11.5px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Certificato Assente con Evidenza:</span>
                </div>
                <p className="text-[11px] text-emerald-900">
                  {absentList.map(a => a.meta.label).join(', ')}
                </p>
              </div>
            )}

            {/* Verified Dietary Suitability Labels */}
            {dietaryBadges.length > 0 && (
              <div className="pt-1">
                <span className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Idoneità Dietetica Verificata:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dietaryBadges.map(badge => (
                    <span 
                      key={badge.label}
                      className="px-2.5 py-1 bg-emerald-100 text-[#124b2e] font-semibold text-xs rounded-lg border border-emerald-300 flex items-center gap-1"
                    >
                      <Leaf className="w-3 h-3 text-emerald-700" />
                      <span>{badge.label}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  Nota: Le certificazioni alimentari (es. Vegano o Halal) non garantiscono la totale assenza di tracce involontarie di allergeni.
                </p>
              </div>
            )}

            {/* Verification Metadata Footer */}
            {isVerified && (
              <div className="text-[10.5px] text-slate-500 pt-1 border-t border-amber-200/50 flex flex-wrap items-center justify-between gap-1">
                <span>
                  Fonte: <strong>{dietary?.infoSource || 'Ispezione confezione'}</strong>
                </span>
                {dietary?.lastReviewedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Verificato il: {dietary.lastReviewedDate}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-y border-stone-100 text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              Ritiro in ~30 min in Via Ugo Bassi 104
            </span>
            <span className="font-semibold text-emerald-800">
              {product.stock > 0 ? `Disponibile in Negozio (${product.stock})` : 'Esaurito'}
            </span>
          </div>

          {/* Price & Add */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-slate-400 block">Prezzo unitario</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  €{product.price.toFixed(2)}
                </span>
                {isProductDiscountActive(product) && product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-slate-400 line-through">
                      €{product.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      Risparmi €{(product.originalPrice - product.price).toFixed(2)} (-{calculateDiscountPercentage(product.originalPrice, product.price)}%)
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-1.5 text-slate-600 hover:bg-stone-200 cursor-pointer"
                  aria-label="Riduci quantità"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 font-semibold text-xs text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2.5 py-1.5 text-slate-600 hover:bg-stone-200 cursor-pointer"
                  aria-label="Aumenta quantità"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#124b2e] hover:bg-[#0e3b24] text-white shadow-xs'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Aggiunto!</span>
                  </>
                ) : (
                  <span>Aggiungi al Carrello</span>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
