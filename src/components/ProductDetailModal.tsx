import React, { useState } from 'react';
import { 
  X, Plus, Minus, Check, MapPin, 
  AlertTriangle, CheckCircle2, Leaf, Info, Calendar, Sparkles, Flame, Clock
} from 'lucide-react';
import { Product } from '../types';
import { resolveProductImage } from '../utils/imageHelper';
import { OptimizedImage } from './OptimizedImage';
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

const NON_FOOD_CATEGORIES = new Set([
  'Capelli e bellezza',
  'Cura della pelle',
  'Saponi e igiene',
  'Profumi'
]);

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
  const isNonFood = NON_FOOD_CATEGORIES.has(product.category);

  // Deduplicate intolerance / safety note so it never repeats twice
  const primaryNote = dietary?.intoleranceNotes?.trim() || product.allergenInfo?.trim() || '';
  const secondaryNote = dietary?.warningNote?.trim() && dietary.warningNote.trim() !== primaryNote
    ? dietary.warningNote.trim()
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto animate-fade-fast">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 my-auto sm:my-8 animate-slide-up-mobile will-change-transform">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <span>{product.brand && product.brand !== 'Non identificata' ? product.brand : product.category}</span>
            <span>·</span>
            <span className="text-slate-600">{product.category}</span>
            {product.origin && !product.origin.toLowerCase().includes('da verificare') && (
              <>
                <span>·</span>
                <span className="text-slate-500">{product.origin}</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-200/60 cursor-pointer"
            aria-label="Chiudi scheda prodotto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="aspect-square max-h-64 w-full rounded-xl overflow-hidden bg-stone-50 border border-stone-200 relative">
            <OptimizedImage
              src={resolveProductImage(product)}
              alt={product.name}
              width={400}
              height={400}
              widths={[240, 400, 800]}
              sizes="(max-width: 640px) 90vw, 480px"
              priority={true}
              className="w-full h-full object-cover"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-1 pointer-events-none">
              {product.verificationStatus === 'da_identificare' ? (
                <span className="px-2 py-0.5 bg-purple-700 text-white text-[10px] font-bold rounded-md shadow-xs uppercase tracking-wider">
                  Da Identificare
                </span>
              ) : product.verificationStatus === 'da_verificare' ? (
                <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-md shadow-xs uppercase tracking-wider">
                  Da Verificare al Banco
                </span>
              ) : product.verificationStatus === 'in_revisione' ? (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md shadow-xs uppercase tracking-wider">
                  In Revisione
                </span>
              ) : isProductNewArrival(product) ? (
                <span className="px-2 py-0.5 bg-[#124b2e] text-white text-[10px] font-bold rounded-md shadow-xs flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>Nuovo Arrivo</span>
                </span>
              ) : <div />}

              {product.price != null && isProductDiscountActive(product) && product.originalPrice && product.originalPrice > product.price && (
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
            <h3 className="font-bold text-lg sm:text-xl text-slate-900 leading-snug">
              {product.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {product.packageSize} {product.brand && product.brand !== 'Non identificata' && `· Marca: ${product.brand}`} {product.sku && `· Codice: ${product.sku}`}
            </p>
          </div>

          {product.description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
              {product.description}
            </p>
          )}

          {/* 1. INGREDIENTS */}
          {product.ingredients && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <strong className="block text-slate-900 font-bold mb-0.5">Ingredienti:</strong>
              <p className="text-slate-700 leading-relaxed">{product.ingredients}</p>
            </div>
          )}

          {/* 2. ALLERGENS, INTOLERANCES & DIETARY DETAILS (Accessible & Cleanly Structured) */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                <Info className="w-4 h-4 text-[#124b2e] shrink-0" />
                <span>{isNonFood ? 'Avvertenze & Composizione' : 'Allergeni, Intolleranze & Dieta'}</span>
              </div>
              {!isNonFood && onOpenAllergenPolicy && (
                <button
                  type="button"
                  onClick={onOpenAllergenPolicy}
                  className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
                >
                  Informativa UE
                </button>
              )}
            </div>

            {/* Declared Present Allergens */}
            {containsList.length > 0 && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Allergeni dichiarati (Contiene):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
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

            {/* Possible Cross-Contact / Intolerances */}
            {mayContainList.length > 0 && (
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Possibili tracce / intolleranze:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mayContainList.map(item => (
                    <span 
                      key={item.meta.key}
                      className="px-2 py-0.5 bg-amber-100 text-amber-900 font-semibold rounded-md text-[11px] border border-amber-300"
                    >
                      {item.displayLabel}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Label / Intolerance Notes */}
            {(primaryNote || secondaryNote || !isVerified) && (
              <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-stone-200 space-y-1 leading-relaxed">
                {primaryNote && (
                  <p>
                    <strong className="text-slate-800">{isNonFood ? 'Note sicurezza:' : 'Note intolleranze:'}</strong> {primaryNote}
                  </p>
                )}
                {!isVerified && (
                  <p className="text-[11px] text-slate-500">
                    {secondaryNote || 'Dati preliminari da inventario: controllare sempre l’etichetta fisica al ritiro.'}
                  </p>
                )}
              </div>
            )}

            {/* Verified Absent Allergens */}
            {absentList.length > 0 && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                <div className="flex items-center gap-1 font-semibold text-emerald-950 text-[11.5px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Certificato Assente:</span>
                </div>
                <p className="text-[11px] text-emerald-900">
                  {absentList.map(a => a.meta.label).join(', ')}
                </p>
              </div>
            )}

            {/* Dietary Preferences (only shown when explicitly verified/declared) */}
            {dietaryBadges.length > 0 && (
              <div className="pt-1">
                <span className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Idoneità Dietetica:
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
              </div>
            )}

            {/* Verification Metadata Footer */}
            {isVerified && (
              <div className="text-[10.5px] text-slate-500 pt-1 border-t border-stone-200 flex flex-wrap items-center justify-between gap-1">
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
              {product.stock != null
                ? (product.stock > 0
                    ? `Disponibile in Negozio (${product.stock})`
                    : (product.verificationStatus !== 'verificato_etichetta'
                        ? 'Da contare al banco (Stock: 0)'
                        : 'Esaurito'))
                : 'Disponibile per il Ritiro'}
            </span>
          </div>

          {/* Price & Add */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {product.price != null && product.price > 0 ? (
                <>
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
                </>
              ) : (
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium">Prezzo indicativo cartellino:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-900">
                      {product.observedPrice && product.observedPrice !== 'Non leggibile' && product.observedPrice !== 'Non confermato'
                        ? product.observedPrice
                        : 'Da verificare in cassa'}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1">
                    Rilevato da inventario foto. Conferma esatta allo scontrino di cassa al ritiro.
                  </span>
                </div>
              )}
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
