import React, { useState } from 'react';
import { 
  Tag, 
  Sparkles, 
  Plus, 
  Minus, 
  Check, 
  ArrowRight, 
  Clock, 
  Flame,
  AlertTriangle 
} from 'lucide-react';
import { Product } from '../types';
import { resolveImage } from '../utils/imageHelper';
import { 
  isProductDiscountActive, 
  isProductNewArrival, 
  calculateDiscountPercentage,
  formatDateToItalian 
} from '../utils/promotionsHelper';
import { getContainsList, getMayContainList } from '../utils/allergenHelper';

interface PromotionsSectionProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenProductDetail: (product: Product) => void;
  onNavigateSection: (sectionId: string) => void;
}

interface ProductCardProps {
  product: Product;
  type: 'offer' | 'new';
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenProductDetail: (product: Product) => void;
}

const PromoProductCard: React.FC<ProductCardProps> = ({
  product,
  type,
  onAddToCart,
  onOpenProductDetail
}) => {
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, qty);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);
  };

  const discountPercent = calculateDiscountPercentage(product.originalPrice, product.price);
  const contains = getContainsList(product.dietaryInfo);
  const mayContain = getMayContainList(product.dietaryInfo);

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/90 hover:border-emerald-600/40 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden">
      
      {/* Product Image & Badges */}
      <div 
        onClick={() => onOpenProductDetail(product)}
        className="relative aspect-square w-full overflow-hidden bg-stone-50 cursor-pointer p-3 flex items-center justify-center"
      >
        <img
          src={resolveImage(product.image)}
          alt={product.name}
          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-1 pointer-events-none">
          {type === 'new' || product.isNewArrival ? (
            <span className="px-2 py-0.5 bg-[#124b2e] text-white text-[10px] font-bold rounded-md shadow-xs flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>Nuovo</span>
            </span>
          ) : <div />}

          {(type === 'offer' || (product.originalPrice && product.originalPrice > product.price)) && (
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10.5px] font-extrabold rounded-md shadow-xs flex items-center gap-1 tracking-tight">
              <Flame className="w-3 h-3 fill-white" />
              <span>-{discountPercent}%</span>
            </span>
          )}
        </div>

        {/* Low Stock Badge */}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-3 left-3 px-1.5 py-0.5 bg-amber-500/95 text-white text-[10px] font-bold rounded-md shadow-xs pointer-events-none">
            Solo {product.stock} rimasti
          </span>
        )}

        {/* Schedule / Expiration notice on hover */}
        {product.discountEndDate && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9.5px] font-medium rounded-md shadow-xs flex items-center gap-1 pointer-events-none">
            <Clock className="w-2.5 h-2.5 text-amber-300" />
            <span>Fino al {formatDateToItalian(product.discountEndDate)}</span>
          </span>
        )}
      </div>

      {/* Product Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="truncate max-w-[120px] font-medium text-emerald-800">{product.category}</span>
            <span className="truncate">{product.origin}</span>
          </div>

          <h3 
            onClick={() => onOpenProductDetail(product)}
            className="font-bold text-sm sm:text-[14.5px] text-slate-900 group-hover:text-[#124b2e] transition-colors leading-snug cursor-pointer line-clamp-2 min-h-[40px]"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-[11.5px] text-slate-500 mt-1 mb-2">
            {product.packageSize}
          </p>

          {/* Quick Allergen Tag if present */}
          {(contains.length > 0 || mayContain.length > 0) && (
            <div className="mb-2 min-h-[18px]">
              {contains.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold">
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                  <span className="truncate max-w-[150px]">Contiene: {contains.map(c => c.meta.shortLabel).join(', ')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  <span className="truncate max-w-[150px]">Tracce: {mayContain.map(c => c.meta.shortLabel).join(', ')}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Add Controls */}
        <div className="pt-2.5 border-t border-stone-100 mt-2">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-lg text-slate-900">
                €{product.price.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  €{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10.5px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                Risparmi €{(product.originalPrice - product.price).toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Stepper */}
            <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }}
                className="px-2 py-1.5 text-slate-600 hover:bg-stone-200 text-xs transition-colors cursor-pointer"
                aria-label="Riduci quantità"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 py-1 text-xs font-semibold text-slate-800 select-none min-w-[20px] text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setQty(qty + 1); }}
                className="px-2 py-1.5 text-slate-600 hover:bg-stone-200 text-xs transition-colors cursor-pointer"
                aria-label="Aumenta quantità"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Add to Cart button */}
            <button
              type="button"
              onClick={handleAdd}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#124b2e] hover:bg-[#0e3b24] text-white shadow-2xs'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Aggiunto!</span>
                </>
              ) : (
                <span>Aggiungi</span>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export const PromotionsSection: React.FC<PromotionsSectionProps> = ({
  products,
  onAddToCart,
  onOpenProductDetail,
  onNavigateSection
}) => {
  const now = new Date();

  // Filter active discounts strictly (in stock, available, not expired, not future scheduled)
  const activeDiscounts = products.filter(p => isProductDiscountActive(p, now));

  // Filter new arrivals strictly (marked new, available, in stock)
  const newArrivals = products.filter(p => isProductNewArrival(p));

  const hasDiscounts = activeDiscounts.length > 0;
  const hasNewArrivals = newArrivals.length > 0;

  if (!hasDiscounts && !hasNewArrivals) {
    return null;
  }

  // Render Special Offers section
  const renderSpecialOffers = () => {
    if (!hasDiscounts) return null;

    return (
      <section 
        id="special-offers-section" 
        className="py-10 sm:py-14 bg-gradient-to-b from-rose-50/50 via-[#fdfbf9] to-[#fbfbf9] border-b border-stone-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded-full mb-2">
                <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                <span>Offerte Speciali a Tempo Limitato</span>
              </div>
              <h2 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Sconti Esclusivi Mama Sam
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
                I migliori prezzi su alimenti e spezie autentiche dell'Africa e dei Caraibi. Ordina online con ritiro rapido a Messina.
              </p>
            </div>

            <button
              onClick={() => onNavigateSection('products-section')}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#124b2e] hover:text-emerald-900 group cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>Vedi Tutto il Catalogo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {activeDiscounts.map(product => (
              <PromoProductCard
                key={product.id}
                product={product}
                type="offer"
                onAddToCart={onAddToCart}
                onOpenProductDetail={onOpenProductDetail}
              />
            ))}
          </div>

        </div>
      </section>
    );
  };

  // Render New Arrivals section
  const renderNewArrivals = () => {
    if (!hasNewArrivals) return null;

    return (
      <section 
        id="new-arrivals-section" 
        className="py-10 sm:py-14 bg-gradient-to-b from-emerald-50/40 via-white to-[#fbfbf9] border-b border-stone-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-full mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Novità in Negozio</span>
              </div>
              <h2 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Nuovi Arrivi Africani &amp; Caraibici
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
                Nuove scorte fresche appena arrivate in Via Ugo Bassi 104 da Ghana, Nigeria, Costa d'Avorio e Caraibi.
              </p>
            </div>

            <button
              onClick={() => onNavigateSection('products-section')}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#124b2e] hover:text-emerald-900 group cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>Scopri Altri Prodotti</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {newArrivals.map(product => (
              <PromoProductCard
                key={product.id}
                product={product}
                type="new"
                onAddToCart={onAddToCart}
                onOpenProductDetail={onOpenProductDetail}
              />
            ))}
          </div>

        </div>
      </section>
    );
  };

  // Requirement:
  // "Display a prominent Special Offers section near the top of the homepage whenever active discounts exist.
  // Display New Arrivals immediately after Special Offers.
  // If there are no active discounts, show New Arrivals first."
  return (
    <>
      {hasDiscounts ? (
        <>
          {renderSpecialOffers()}
          {renderNewArrivals()}
        </>
      ) : (
        <>
          {renderNewArrivals()}
        </>
      )}
    </>
  );
};
