import React, { useState } from 'react';
import { X, Clock, Utensils, ShoppingBag, Check, ChefHat } from 'lucide-react';
import { Recipe } from '../types';
import { resolveImage } from '../utils/imageHelper';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onAddBundleToCart: (recipe: Recipe) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  recipe,
  onClose,
  onAddBundleToCart
}) => {
  const [isAdded, setIsAdded] = useState(false);

  if (!recipe) return null;

  const handleAdd = () => {
    onAddBundleToCart(recipe);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 my-8">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
              {recipe.region} · {recipe.difficulty}
            </span>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-0.5">
              {recipe.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-stone-100">
            <img
              src={resolveImage(recipe.image)}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
            "{recipe.description}"
          </p>

          {/* Bundled Ingredients */}
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-2.5 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span>Ingredienti Inclusi nel Kit:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200"
                >
                  <img
                    src={resolveImage(ing.image)}
                    alt={ing.name}
                    className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900 truncate">{ing.name}</p>
                    <p className="text-[11px] text-slate-500">{ing.amount} · €{ing.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cooking Method Steps */}
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-2.5 flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-emerald-700" />
              <span>Metodo di Preparazione Passo-Passo:</span>
            </h4>
            <ol className="space-y-2.5 text-xs text-slate-600">
              {recipe.cookingMethod.map((step, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="pt-0.5 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Action */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">Kit Completo {recipe.ingredients.length} Prodotti</span>
              <span className="font-extrabold text-xl text-slate-900">
                €{recipe.totalPrice.toFixed(2)}
              </span>
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
                  <span>Aggiunto al Carrello!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-emerald-300" />
                  <span>Aggiungi Ingredienti al Carrello (€{recipe.totalPrice.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
