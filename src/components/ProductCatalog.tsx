import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Minus, 
  Check, 
  ArrowUpDown, 
  ShoppingBag, 
  Sparkles,
  Info,
  Flame,
  ChevronDown
} from 'lucide-react';
import { Product } from '../types';
import { resolveProductImage } from '../utils/imageHelper';
import { getContainsList, getDietaryBadges } from '../utils/allergenHelper';
import { isProductDiscountActive, isProductNewArrival, calculateDiscountPercentage } from '../utils/promotionsHelper';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenProductDetail: (product: Product) => void;
  searchQuery: string;
  onClearSearch: () => void;
}

const INITIAL_VISIBLE_COUNT = 16;

interface CatalogCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenProductDetail: (product: Product) => void;
}

const CatalogProductCard: React.FC<CatalogCardProps> = React.memo(({
  product,
  onAddToCart,
  onOpenProductDetail
}) => {
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const imgSrc = useMemo(() => resolveProductImage(product), [product]);
  const contains = useMemo(() => getContainsList(product.dietaryInfo), [product.dietaryInfo]);
  const dietaryBadges = useMemo(() => getDietaryBadges(product.dietaryInfo), [product.dietaryInfo]);
  const hasConfirmedPrice = product.price != null && product.price > 0;
  const discountActive = hasConfirmedPrice && isProductDiscountActive(product);
  const isNew = isProductNewArrival(product);

  const handleAdd = () => {
    onAddToCart(product, qty);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Product Card Top: Brand & Origin */}
      <div className="px-2.5 sm:px-3.5 pt-2.5 sm:pt-3 pb-1 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-medium">
        <span className="truncate max-w-[65%] font-semibold text-emerald-800">
          {product.brand && product.brand !== 'Non identificata' ? product.brand : (product.subCategory || product.category)}
        </span>
        <span className="text-slate-300 hidden sm:inline">·</span>
        <span className="text-slate-600 font-medium truncate ml-1 text-right">
          {product.origin || 'Importato'}
        </span>
      </div>

      {/* Product Image */}
      <div 
        onClick={() => onOpenProductDetail(product)}
        className="relative aspect-square w-full overflow-hidden bg-stone-50 cursor-pointer p-2 flex items-center justify-center"
      >
        <img
          src={imgSrc}
          alt={product.name}
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
        />
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1 pointer-events-none">
          {product.verificationStatus === 'da_identificare' ? (
            <span className="px-1.5 py-0.5 bg-purple-700 text-white text-[9px] font-bold rounded shadow-2xs">
              Da Identificare
            </span>
          ) : product.verificationStatus === 'da_verificare' ? (
            <span className="px-1.5 py-0.5 bg-amber-600 text-white text-[9px] font-bold rounded shadow-2xs">
              Da Verificare
            </span>
          ) : product.verificationStatus === 'in_revisione' ? (
            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded shadow-2xs">
              In Revisione
            </span>
          ) : isNew ? (
            <span className="px-1.5 py-0.5 bg-[#124b2e] text-white text-[9.5px] font-bold rounded shadow-2xs flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>Nuovo</span>
            </span>
          ) : <div />}

          {discountActive && (
            <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded shadow-2xs flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-white" />
              <span>-{calculateDiscountPercentage(product.originalPrice ?? undefined, product.price ?? undefined)}%</span>
            </span>
          )}
        </div>

        {product.stock != null && product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-2.5 left-2.5 px-1.5 py-0.5 bg-amber-500/95 text-white text-[10px] font-bold rounded shadow-2xs pointer-events-none">
            Solo {product.stock} rimasti
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            onClick={() => onOpenProductDetail(product)}
            className="font-bold text-[13px] sm:text-[14px] text-slate-900 group-hover:text-[#124b2e] transition-colors leading-snug cursor-pointer line-clamp-2 min-h-[36px] sm:min-h-[40px]"
            title={product.name}
          >
            {product.name}
          </h3>
          
          <p className="text-[11px] sm:text-[11.5px] text-slate-500 mt-0.5 mb-1.5 truncate">
            {product.packageSize}
          </p>

          {/* Discreet Allergen Indicator (only when declared allergens exist) */}
          {(contains.length > 0 || dietaryBadges.length > 0) && (
            <div className="flex flex-wrap items-center gap-1 mb-2">
              {contains.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenProductDetail(product)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50/80 border border-rose-200/80 text-rose-800 text-[9.5px] sm:text-[10px] font-semibold cursor-pointer hover:bg-rose-100/70 transition-colors"
                  title={`Allergeni dichiarati: ${contains.map(c => c.displayLabel).join(', ')}`}
                >
                  <Info className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-[160px]">
                    Allergeni: {contains.map(c => c.meta.shortLabel).join(', ')}
                  </span>
                </button>
              )}

              {dietaryBadges.slice(0, 1).map(badge => (
                <span
                  key={badge.label}
                  className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[#124b2e] text-[9.5px] sm:text-[10px] font-semibold"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Add Controls */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex flex-col mb-2 sm:mb-2.5 min-h-[34px] justify-center">
            {hasConfirmedPrice ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-[15px] sm:text-base text-slate-900">
                  €{product.price!.toFixed(2)}
                </span>
                {discountActive && product.originalPrice && product.originalPrice > product.price! && (
                  <span className="text-[11px] sm:text-xs text-slate-400 line-through">
                    €{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-[9.5px] text-slate-500 font-medium">Prezzo stimato:</span>
                <span className="font-extrabold text-[13px] sm:text-[14px] text-emerald-900">
                  {product.observedPrice && product.observedPrice !== 'Non leggibile' && product.observedPrice !== 'Non confermato'
                    ? `${product.observedPrice} (da conf.)`
                    : 'Da verificare in cassa'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-1.5 sm:px-2 py-1 text-slate-600 hover:bg-stone-200 text-xs transition-colors cursor-pointer tap-bounce"
                aria-label="Riduci quantità"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-semibold text-slate-800 select-none min-w-[18px] text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                className="px-1.5 sm:px-2 py-1 text-slate-600 hover:bg-stone-200 text-xs transition-colors cursor-pointer tap-bounce"
                aria-label="Aumenta quantità"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Add Button */}
            <button
              type="button"
              onClick={handleAdd}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer tap-bounce ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#124b2e] active:bg-[#0e3b24] text-white shadow-2xs'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Aggiunto!</span>
                </>
              ) : (
                <span>{hasConfirmedPrice ? 'Aggiungi' : 'Aggiungi al Carrello'}</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
});

CatalogProductCard.displayName = 'CatalogProductCard';

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onOpenProductDetail,
  searchQuery,
  onClearSearch
}) => {
  const [sortBy, setSortBy] = useState<'bestsellers' | 'price-low' | 'price-high' | 'name'>('bestsellers');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [selectedCategory, searchQuery, sortBy]);

  const categories = useMemo(() => {
    const allKnownCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['Tutti i Prodotti', ...allKnownCats];
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedCategory && selectedCategory !== 'Tutti i Prodotti') {
      list = list.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.origin && p.origin.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'bestsellers') {
        return (a.salesRank || 99) - (b.salesRank || 99);
      }
      if (sortBy === 'price-low') {
        const pA = a.price != null ? a.price : 999999;
        const pB = b.price != null ? b.price : 999999;
        return pA - pB;
      }
      if (sortBy === 'price-high') {
        const pA = a.price != null ? a.price : -1;
        const pB = b.price != null ? b.price : -1;
        return pB - pA;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const visibleProducts = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const remainingCount = Math.max(0, filtered.length - visibleProducts.length);

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + INITIAL_VISIBLE_COUNT);
  }, []);

  const handleShowAll = useCallback(() => {
    setVisibleCount(filtered.length);
  }, [filtered.length]);

  return (
    <section id="products-section" className="py-12 sm:py-16 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              Tutti i Prodotti
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Mostrati {visibleProducts.length} di {filtered.length} prodotti disponibili per il ritiro in negozio
            </p>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              Ordina per:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-base sm:text-sm font-semibold text-slate-800 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:border-[#124b2e] outline-hidden cursor-pointer"
            >
              <option value="bestsellers">I Più Venduti</option>
              <option value="price-low">Prezzo: Dal più basso</option>
              <option value="price-high">Prezzo: Dal più alto</option>
              <option value="name">Nome Prodotto (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills / Segmented Controls with Smooth Horizontal Snap */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-6 no-scrollbar scroll-smooth snap-x snap-mandatory">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`snap-start px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-medium whitespace-nowrap transition-all cursor-pointer tap-bounce ${
                  isSelected
                    ? 'bg-[#124b2e] text-white shadow-2xs font-semibold'
                    : 'bg-stone-100/90 hover:bg-stone-200/70 text-slate-700 border border-stone-200/60 active:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search filter indicator */}
        {searchQuery && (
          <div className="mb-6 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-fade-fast">
            <span>Risultati per: <strong>"{searchQuery}"</strong> ({filtered.length} prodotti trovati)</span>
            <button
              onClick={onClearSearch}
              className="text-xs font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer tap-bounce"
            >
              Azzera Ricerca
            </button>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-8 animate-fade-fast">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base mb-1">Nessun prodotto corrisponde ai criteri</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Prova a cercare prodotti come "yam", "garri", "ramen", "olio di cocco" o azzera i filtri.
            </p>
            <button
              onClick={() => { onSelectCategory('Tutti i Prodotti'); onClearSearch(); }}
              className="px-4 py-2 bg-[#124b2e] text-white text-xs font-semibold rounded-lg cursor-pointer tap-bounce"
            >
              Mostra Tutti i Prodotti
            </button>
          </div>
        )}

        {/* Responsive Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
          {visibleProducts.map((product) => (
            <CatalogProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onOpenProductDetail={onOpenProductDetail}
            />
          ))}
        </div>

        {/* Incremental Pagination Controls */}
        {remainingCount > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleLoadMore}
              className="px-5 py-2.5 bg-[#124b2e] hover:bg-[#0e3b24] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer tap-bounce"
            >
              <span>Mostra altri {Math.min(INITIAL_VISIBLE_COUNT, remainingCount)} prodotti</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {remainingCount > INITIAL_VISIBLE_COUNT && (
              <button
                type="button"
                onClick={handleShowAll}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-stone-200 transition-colors cursor-pointer tap-bounce"
              >
                Vedi tutti ({filtered.length})
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
