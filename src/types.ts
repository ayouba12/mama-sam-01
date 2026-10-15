export type ProductCategory = 
  | 'Tuberi e Verdure Fresche'
  | 'Cereali e Farine Tradizionali'
  | 'Pesce Affumicato e Carni'
  | 'Spezie e Olio di Palma'
  | 'Bevande al Malto e Ibisco'
  | 'Snack e Dolci Caraibici'
  | 'Cura Afro e Cosmetici';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  origin: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  packageSize: string;
  image: string;
  imageStatus?: 'verified' | 'needs_review' | 'missing';
  gallery?: string[];
  description: string;
  stock: number;
  isAvailable: boolean;
  featured?: boolean;
  salesRank?: number;
  ingredients?: string;
  allergenInfo?: string;
  dietaryInfo?: ProductDietaryInfo;
  sku?: string;
  isNewArrival?: boolean;
  isDiscounted?: boolean;
  discountActive?: boolean;
  discountStartDate?: string;
  discountEndDate?: string;
  createdAt?: string;
}

export type AllergenKey = 
  | 'cereals_gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soybeans'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

export type AllergenPresence = 
  | 'contains'          // Present as an ingredient
  | 'may_contain'       // May contain / possible cross-contact
  | 'not_declared'      // Not declared (never assumed free)
  | 'verified_absent';  // Verified absent with evidence

export interface AllergenItemState {
  status: AllergenPresence;
  specificDetails?: string; // e.g. "Wheat", "Barley", "Almond", "Cashew"
}

export type AllergenRecords = Record<AllergenKey, AllergenItemState>;

export interface ProductDietaryInfo {
  vegetarian?: boolean;
  vegan?: boolean;
  halal?: boolean;
  lactoseFreeClaim?: boolean;
  glutenFreeClaim?: boolean;
  intoleranceNotes?: string;
  warningNote?: string;
  infoSource?: string;
  verificationStatus: 'unverified' | 'label_inspected' | 'supplier_confirmed';
  lastReviewedDate?: string;
  allergens: AllergenRecords;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface RecipeIngredient {
  productId: string;
  name: string;
  image: string;
  amount: string;
  price: number;
}

export interface Recipe {
  id: string;
  title: string;
  region: string;
  difficulty: 'Easy' | 'Medium' | 'Community Classic';
  prepTime: string;
  description: string;
  image: string;
  ingredients: RecipeIngredient[];
  totalPrice: number;
  cookingMethod: string[];
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'collected' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  packageSize: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupTimePreference: string;
  customerNote?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'Pay at Store (Cash / Card / Satispay)';
  staffNotes?: string;
  statusUpdatedAt?: string;
}

export interface StoreSettings {
  announcement: string;
  announcementActive: boolean;
  storeName: string;
  address: string;
  googleMapsUrl: string;
  phone1: string;
  phone2: string;
  whatsappNumber: string;
  email: string;
  hoursMonSat: string;
  hoursSun: string;
  pickupEstimatedMinutes: number;
}

export interface Review {
  id: string;
  author: string;
  stats: string;
  rating: number;
  content: string;
  storeResponse?: string;
}
