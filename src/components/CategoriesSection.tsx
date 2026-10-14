import React from 'react';
import { ArrowRight } from 'lucide-react';
import { resolveImage } from '../utils/imageHelper';

interface CategoryItem {
  id: string;
  name: string;
  summary: string;
  image: string;
  itemCount: number;
}

interface CategoriesSectionProps {
  categories: CategoryItem[];
  onSelectCategory: (categoryName: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  onSelectCategory
}) => {
  return (
    <section id="categories-section" className="py-10 sm:py-14 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 sm:mb-8">
          <div>
            <span className="text-[11px] font-bold tracking-[0.14em] text-emerald-800 uppercase block mb-1">
              Corsie del Negozio
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Sfoglia per Categoria
            </h2>
          </div>

          <button
            onClick={() => onSelectCategory('Tutti i Prodotti')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#124b2e] hover:text-emerald-800 group cursor-pointer"
          >
            <span>Tutte le Categorie</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Categories Grid (4 cols on lg, 2 on sm) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {categories.map((cat) => {
            const imgSrc = resolveImage(cat.image);
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200/90 hover:border-emerald-500/80 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/2.8] w-full overflow-hidden bg-stone-100">
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Item count tag */}
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-semibold rounded-md shadow-xs">
                    {cat.itemCount} Articoli
                  </span>
                </div>

                {/* Content */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-[15px] text-slate-900 group-hover:text-[#124b2e] transition-colors leading-snug">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {cat.summary}
                    </p>
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
