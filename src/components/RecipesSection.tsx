import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Recipe } from '../types';
import { resolveImage } from '../utils/imageHelper';

interface RecipesSectionProps {
  recipes: Recipe[];
  onAddBundleToCart: (recipe: Recipe) => void;
  onViewRecipe: (recipe: Recipe) => void;
}

export const RecipesSection: React.FC<RecipesSectionProps> = ({
  recipes,
  onAddBundleToCart,
  onViewRecipe
}) => {
  const [addedRecipeId, setAddedRecipeId] = useState<string | null>(null);

  const handleAddBundle = (recipe: Recipe) => {
    onAddBundleToCart(recipe);
    setAddedRecipeId(recipe.id);
    setTimeout(() => {
      setAddedRecipeId(null);
    }, 2000);
  };

  return (
    <section id="recipes-section" className="py-12 sm:py-16 bg-[#faf9f5] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-8 sm:mb-10">
          <span className="text-[11px] font-bold tracking-[0.14em] text-amber-800 uppercase block mb-1">
            Kit Ricette Tradizionali
          </span>
          <h2 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Cucina i Grandi Piatti a Casa Tua
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mt-1.5 leading-relaxed">
            Clicca su qualsiasi piatto per visualizzare la ricetta passo-passo, oppure aggiungi tutti gli ingredienti necessari al carrello in un click.
          </p>
        </div>

        {/* 4 Recipe Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {recipes.map((recipe) => {
            const isAdded = addedRecipeId === recipe.id;
            const imgSrc = resolveImage(recipe.image);

            return (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Recipe Hero Photo */}
                <div 
                  onClick={() => onViewRecipe(recipe)}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 cursor-pointer"
                  title="Clicca per visualizzare la ricetta"
                >
                  <img
                    src={imgSrc}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                    {recipe.region}
                  </div>
                </div>

                {/* Recipe Meta Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                      <span>{recipe.difficulty}</span>
                      <span>·</span>
                      <span>{recipe.prepTime}</span>
                    </div>

                    <h3 
                      onClick={() => onViewRecipe(recipe)}
                      className="font-bold text-[15px] text-slate-900 group-hover:text-[#124b2e] transition-colors leading-snug cursor-pointer line-clamp-2 mb-2"
                      title="Clicca per vedere ingredienti e preparazione"
                    >
                      {recipe.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {recipe.description}
                    </p>

                    {/* Ingredient circular thumbnails */}
                    <div className="mb-4 pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-2">
                        <span>Include {recipe.ingredients.length} ingredienti:</span>
                      </div>
                      
                      <div className="flex items-center -space-x-1.5">
                        {recipe.ingredients.map((ing, i) => (
                          <div
                            key={i}
                            title={`${ing.name} (${ing.amount})`}
                            className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-stone-100 shadow-2xs shrink-0"
                          >
                            <img
                              src={resolveImage(ing.image)}
                              alt={ing.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 border-t border-stone-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-xs text-slate-500">Prezzo Kit:</span>
                      <span className="font-extrabold text-base text-slate-900">
                        €{recipe.totalPrice.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddBundle(recipe)}
                      className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#124b2e] hover:bg-[#0e3b24] text-white shadow-2xs'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Aggiunto al Carrello!</span>
                        </>
                      ) : (
                        <span>Aggiungi Kit al Carrello</span>
                      )}
                    </button>
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
