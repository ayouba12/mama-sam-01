import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { CategoriesSection } from './components/CategoriesSection';
import { RecipesSection } from './components/RecipesSection';
import { BiometricsBanner } from './components/BiometricsBanner';
import { ProductCatalog } from './components/ProductCatalog';
import { ReviewsSection } from './components/ReviewsSection';
import { StoreLocationSection } from './components/StoreLocationSection';
import { FaqSection } from './components/FaqSection';
import { AssistanceStrip } from './components/AssistanceStrip';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { RecipeModal } from './components/RecipeModal';
import { BiometricsModal } from './components/BiometricsModal';
import { AdminPortal } from './components/AdminPortal';
import { AllergenInfoModal } from './components/AllergenInfoModal';
import { LegalNoticeModal } from './components/LegalNoticeModal';
import { PromotionsSection } from './components/PromotionsSection';

import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Product, Recipe, Review, StoreSettings, CartItem, Order } from './types';

// Default initial settings fallback
const DEFAULT_SETTINGS: StoreSettings = {
  announcement: 'Ordina online e ritira comodamente in negozio in Via Ugo Bassi 104, Messina (~30 min)',
  announcementActive: true,
  storeName: 'Mama Sam Supermercato Africano & Caraibico',
  address: 'Via Ugo Bassi 104, Isolato 147, 98123 Messina ME, Italia',
  googleMapsUrl: 'https://maps.google.com/?q=Via+Ugo+Bassi+104+Messina+Italy',
  phone1: '+39 351 290 1397',
  phone2: '+39 351 206 2949',
  whatsappNumber: '393512901397',
  email: 'mamasamafrican@gmail.com',
  hoursMonSat: '8:00 - 20:30 (Orario Continuato)',
  hoursSun: '10:00 - 16:00',
  pickupEstimatedMinutes: 30
};

export default function App() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Navigation & Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutti i Prodotti');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state (retained in localStorage for customer convenience)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mamasam_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal / Drawer visibility
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBiometricsOpen, setIsBiometricsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAllergenInfoOpen, setIsAllergenInfoOpen] = useState(false);
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState(false);

  // Allow direct access to Admin via URL hash (#admin) or query (?admin=true)
  useEffect(() => {
    const handleUrlRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (hash === '#admin' || hash === '#portal' || params.get('admin') === 'true') {
        setIsAdminOpen(true);
      }
    };
    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    return () => window.removeEventListener('hashchange', handleUrlRoute);
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mamasam_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Fetch initial data from server
  const loadInitialData = async () => {
    try {
      const [setRes, catRes, recRes, revRes, prodRes] = await Promise.all([
        fetch('/api/settings').catch(() => null),
        fetch('/api/categories').catch(() => null),
        fetch('/api/recipes').catch(() => null),
        fetch('/api/reviews').catch(() => null),
        fetch('/api/products').catch(() => null)
      ]);

      if (setRes && setRes.ok) setSettings(await setRes.json());
      if (catRes && catRes.ok) setCategories(await catRes.json());
      if (recRes && recRes.ok) setRecipes(await recRes.json());
      if (revRes && revRes.ok) setReviews(await revRes.json());
      if (prodRes && prodRes.ok) setProducts(await prodRes.json());
    } catch (err) {
      console.error('Error fetching storefront data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Add 4 recipe bundle items
  const handleAddBundleToCart = (recipe: Recipe) => {
    recipe.ingredients.forEach(ing => {
      const foundProduct = products.find(p => p.id === ing.productId);
      if (foundProduct) {
        handleAddToCart(foundProduct, 1);
      }
    });
  };

  // Smooth scroll
  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    const catalogSection = document.getElementById('products-section');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // WhatsApp Order helper
  const handleWhatsAppOrder = () => {
    if (cart.length > 0) {
      const itemList = cart
        .map(i => `• ${i.quantity}x ${i.product.name} (${i.product.packageSize}) - €${(i.product.price * i.quantity).toFixed(2)}`)
        .join('\n');
      const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0).toFixed(2);
      const text = encodeURIComponent(
        `Ciao Mama Sam! Vorrei effettuare questo ordine per il ritiro in negozio:\n\n${itemList}\n\n*Totale Stimato:* €${total}\n*Punto di Ritiro:* Via Ugo Bassi 104, Messina.`
      );
      window.open(`https://wa.me/${settings.whatsappNumber}?text=${text}`, '_blank');
    } else {
      const text = encodeURIComponent(
        'Ciao Mama Sam! Vorrei avere informazioni sui prodotti freschi disponibili per il ritiro in negozio a Messina.'
      );
      window.open(`https://wa.me/${settings.whatsappNumber}?text=${text}`, '_blank');
    }
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = Number(
    cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0).toFixed(2)
  );

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-slate-900 flex flex-col font-sans">
      
      {/* 1. Header (Top banner, pickup sub-strip, logo, nav, search) */}
      <Header
        settings={settings}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenBiometrics={() => setIsBiometricsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateSection={handleNavigateSection}
      />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          settings={settings}
          onShopClick={() => handleNavigateSection('products-section')}
          onShopOffersClick={() => handleNavigateSection('special-offers-section')}
          onDiscoverNewClick={() => handleNavigateSection('new-arrivals-section')}
          onWhatsAppClick={handleWhatsAppOrder}
        />

        {/* 3. Trust Strip (4 informational cards) */}
        <TrustStrip />

        {/* 3.5. Special Offers & New Arrivals Showcases */}
        <PromotionsSection
          products={products}
          onAddToCart={handleAddToCart}
          onOpenProductDetail={(prod) => setSelectedProduct(prod)}
          onNavigateSection={handleNavigateSection}
        />

        {/* 4. Shop by Categories */}
        <CategoriesSection
          categories={categories}
          onSelectCategory={handleSelectCategory}
        />

        {/* 5. Traditional Dishes (Cook Traditional Dishes at Home) */}
        <RecipesSection
          recipes={recipes}
          onAddBundleToCart={handleAddBundleToCart}
          onViewRecipe={(recipe) => setSelectedRecipe(recipe)}
        />

        {/* 6. Biometrics Banner (Official Nigerian NIN & BVN Enrollment Desk) */}
        <BiometricsBanner
          onOpenBiometrics={() => setIsBiometricsOpen(true)}
        />

        {/* 7. Product Catalog (All African & Caribbean Groceries) */}
        <ProductCatalog
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddToCart={handleAddToCart}
          onOpenProductDetail={(prod) => setSelectedProduct(prod)}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
        />

        {/* 8. Google Verified Reviews · Messina Community */}
        <ReviewsSection reviews={reviews} />

        {/* 9. Store Collection Point & Physical Supermarket in Messina */}
        <StoreLocationSection settings={settings} />

        {/* 10. Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* 11. Need Assistance in Messina Strip */}
        <AssistanceStrip settings={settings} />
      </main>

      {/* 12. Multi-column Dark Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onSelectCategory={handleSelectCategory}
        onOpenBiometrics={() => setIsBiometricsOpen(true)}
        onWhatsAppOrder={handleWhatsAppOrder}
        onOpenAllergenInfo={() => setIsAllergenInfoOpen(true)}
        onOpenLegalNotice={() => setIsLegalNoticeOpen(true)}
      />

      {/* Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cart}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onProceedToCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={cart}
          settings={settings}
          onOrderSuccess={(_order: Order) => {
            setCart([]);
          }}
        />
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onOpenAllergenPolicy={() => setIsAllergenInfoOpen(true)}
        />
      )}

      {/* Allergen & Dietary Information Modal */}
      {isAllergenInfoOpen && (
        <AllergenInfoModal
          isOpen={isAllergenInfoOpen}
          onClose={() => setIsAllergenInfoOpen(false)}
          settings={settings}
        />
      )}

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onAddBundleToCart={handleAddBundleToCart}
        />
      )}

      {/* Biometrics Appointment Modal */}
      {isBiometricsOpen && (
        <BiometricsModal
          isOpen={isBiometricsOpen}
          onClose={() => setIsBiometricsOpen(false)}
          settings={settings}
        />
      )}

      {/* Protected Admin Portal */}
      {isAdminOpen && (
        <AdminPortal
          isOpen={isAdminOpen}
          onClose={() => {
            setIsAdminOpen(false);
            if (window.location.hash.toLowerCase() === '#admin' || window.location.hash.toLowerCase() === '#portal') {
              history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          }}
          products={products}
          onRefreshProducts={loadInitialData}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      )}

      {/* Sticky Mobile Floating Order Bar */}
      {totalCartCount > 0 && !isCartOpen && !isCheckoutOpen && (
        <aside aria-label="Riepilogo carrello rapido" className="fixed bottom-3 inset-x-3 sm:hidden z-40 animate-slide-up-mobile">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#124b2e] active:bg-[#0e3b24] text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/40 tap-bounce"
            aria-label={`Visualizza carrello con ${totalCartCount} articoli per un totale di ${cartTotal.toFixed(2)} euro`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white shrink-0">
                <ShoppingBag className="w-5 h-5 text-emerald-300" />
                <span className="absolute -top-1 -right-1 bg-amber-400 text-stone-900 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                  Ritiro in Negozio (~30 min)
                </p>
                <p className="text-sm font-extrabold text-white leading-none mt-0.5">
                  €{cartTotal.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-600/90 active:bg-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs">
              <span>Vedi Carrello</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </aside>
      )}

    </div>
  );
}
