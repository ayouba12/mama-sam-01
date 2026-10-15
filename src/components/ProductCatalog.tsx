import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Check, 
  ArrowUpDown, 
  ShoppingBag, 
  Sparkles,
  Info,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { resolveImage } from '../utils/imageHelper';
import { getContainsList, getMayContainList, getDietaryBadges } from '../utils/allergenHelper';
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

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onOpenProductDetail,
  searchQuery,
  onClearSearch
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'bestsellers' | 'price-low' | 'price-high' | 'name'>('bestsellers');

  const categories = [
    'Tutti i Prodotti',
    'Tuberi e Verdure Fresche',
    'Cereali e Farine Tradizionali',
    'Pesce Affumicato e Carni',
    'Spezie e Olio di Palma',
    'Bevande al Malto e Ibisco',
    'Snack e Dolci Caraibici',
    'Cura Afro e Cosmetici'
  ];

  // Adjust card quantity
  const handleQtyChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || 1;
    onAddToCart(product, qty);
    
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  // Filter & Sort
  let filtered = [...products];

  if (selectedCategory && selectedCategory !== 'Tutti i Prodotti') {
    filtered = filtered.filter(p => p.category === selectedCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.origin && p.origin.toLowerCase().includes(q))
    );
  }

  filtered.sort((a, b) => {
    if (sortBy === 'bestsellers') {
      return (a.salesRank || 99) - (b.salesRank || 99);
    }
    if (sortBy === 'price-low') {
      return a.price - b.price;
    }
    if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

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
              Mostrati {filtered.length} prodotti disponibili per il ritiro in negozio
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
              className="text-xs sm:text-sm font-semibold text-slate-800 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:border-[#124b2e] outline-hidden cursor-pointer"
            >
              <option value="bestsellers">I Più Venduti</option>
              <option value="price-low">Prezzo: Dal più basso</option>
              <option value="price-high">Prezzo: Dal più alto</option>
              <option value="name">Nome Prodotto (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills / Segmented Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#124b2e] text-white shadow-2xs'
                    : 'bg-stone-100/80 hover:bg-stone-200/70 text-slate-700 border border-stone-200/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search filter indicator */}
        {searchQuery && (
          <div className="mb-6 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <span>Risultati per: <strong>"{searchQuery}"</strong> ({filtered.length} prodotti trovati)</span>
            <button
              onClick={onClearSearch}
              className="text-xs font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
            >
              Azzera Ricerca
            </button>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-8">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base mb-1">Nessun prodotto corrisponde ai criteri</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Prova a cercare prodotti come "yam", "garri", "platano", "olio di palma" o azzera i filtri.
            </p>
            <button
              onClick={() => { onSelectCategory('Tutti i Prodotti'); onClearSearch(); }}
              className="px-4 py-2 bg-[#124b2e] text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Mostra Tutti i Prodotti
            </button>
          </div>
        )}

        {/* 4-column Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {filtered.map((product) => {
            const qty = quantities[product.id] || 1;
            const isAdded = addedIds[product.id] || false;
            const imgSrc = resolveImage(product.image);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-stone-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Product Card Top: Subcategory & Origin */}
                <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="truncate">
                    {product.subCategory || product.category}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600 font-semibold truncate ml-1">
                    {product.origin}
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
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1 pointer-events-none">
                    {isProductNewArrival(product) ? (
                      <span className="px-1.5 py-0.5 bg-[#124b2e] text-white text-[9.5px] font-bold rounded shadow-2xs flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        <span>Nuovo</span>
                      </span>
                    ) : <div />}

                    {isProductDiscountActive(product) && (
                      <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded shadow-2xs flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 fill-white" />
                        <span>-{calculateDiscountPercentage(product.originalPrice, product.price)}%</span>
                      </span>
                    )}
                  </div>

                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="absolute bottom-2.5 left-2.5 px-1.5 py-0.5 bg-amber-500/95 text-white text-[10px] font-bold rounded shadow-2xs pointer-events-none">
                      Solo {product.stock} rimasti
                    </span>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 
                      onClick={() => onOpenProductDetail(product)}
                      className="font-bold text-[14px] text-slate-900 group-hover:text-[#124b2e] transition-colors leading-snug cursor-pointer line-clamp-2 min-h-[40px]"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                    
                    <p className="text-[11.5px] text-slate-500 mt-1 mb-1.5">
                      {product.packageSize}
                    </p>

                    {/* Compact Allergen & Dietary Warning Indicator */}
                    <div className="flex flex-wrap items-center gap-1 mb-2.5 min-h-[18px]">
                      {(() => {
                        const contains = getContainsList(product.dietaryInfo);
                        const mayContain = getMayContainList(product.dietaryInfo);
                        const dietaryBadges = getDietaryBadges(product.dietaryInfo);

                        return (
                          <>
                            {contains.length > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold"
                                title={`Contiene: ${contains.map(c => c.displayLabel).join(', ')}`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                <span className="truncate max-w-[150px]">Contiene: {contains.map(c => c.meta.shortLabel).join(', ')}</span>
                              </span>
                            ) : mayContain.length > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold"
                                title={`Può contenere: ${mayContain.map(c => c.displayLabel).join(', ')}`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span className="truncate max-w-[150px]">Può contenere: {mayContain.map(c => c.meta.shortLabel).join(', ')}</span>
                              </span>
                            ) : product.allergenInfo ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium"
                                title={product.allergenInfo}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span>Avviso allergeni</span>
                              </span>
                            ) : null}

                            {dietaryBadges.slice(0, 1).map(badge => (
                              <span
                                key={badge.label}
                                className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[#124b2e] text-[10px] font-semibold"
                              >
                                {badge.label}
                              </span>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Pricing & Add Controls */}
                  <div className="pt-2 border-t border-stone-100">
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="font-extrabold text-base text-slate-900">
                        €{product.price.toFixed(2)}
                      </span>
                      {isProductDiscountActive(product) && product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          €{product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quantity Stepper [- 1 +] */}
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(product.id, -1)}
                          className="px-2 py-1 text-slate-600 hover:bg-stone-200 text-xs transition-colors cursor-pointer"
                          aria-label="Riduci quantità"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-1 text-xs font-semibold text-slate-800 select-none min-w-[20px] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(product.id, 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-stone-200 text-xs transition-colors cursor-pointer"
                          aria-label="Aumenta quantità"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => handleAdd(product)}
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
          })}
        </div>

      </div>
    </section>
  );
};
