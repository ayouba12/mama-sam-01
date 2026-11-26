import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Edit2, 
  Trash2, 
  Printer, 
  LogOut, 
  Search, 
  Save, 
  ChevronRight,
  Eye,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Flame,
  Sparkles,
  Calendar,
  Tag,
  Database,
  Server,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Mail,
  Key,
  Bell,
  Send
} from 'lucide-react';
import { Product, Order, OrderStatus, StoreSettings, ProductCategory } from '../types';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import { OptimizedImage } from './OptimizedImage';
import { resolveImage, resolveProductImage } from '../utils/imageHelper';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  isProductDiscountActive, 
  isProductNewArrival, 
  calculateDiscountPercentage, 
  getPromotionScheduleStatus,
  formatDateToItalian 
} from '../utils/promotionsHelper';

// In-memory session holder (tokens are never stored in localStorage or sessionStorage)
let inMemoryAdminToken = '';
let inMemoryAdminUser: any = null;

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  settings,
  onUpdateSettings
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(inMemoryAdminToken));
  const [authToken, setAuthToken] = useState<string>(() => inMemoryAdminToken);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessNotice, setAuthSuccessNotice] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authSetupRequired, setAuthSetupRequired] = useState(false);
  const [claimPasswordInput, setClaimPasswordInput] = useState('');
  const [claimConfirmInput, setClaimConfirmInput] = useState('');
  const [adminUser, setAdminUser] = useState<any>(() => inMemoryAdminUser);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'settings' | 'supabase'>('dashboard');

  // Password Change Controls
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  // Supabase Diagnostics
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseSyncing, setSupabaseSyncing] = useState(false);
  const [supabaseSyncFeedback, setSupabaseSyncFeedback] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Category Management
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSummary, setNewCatSummary] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Stats & Orders
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Product Editing / Creation
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [productSearch, setProductSearch] = useState('');
  const [productPromoFilter, setProductPromoFilter] = useState<'all' | 'da_verificare' | 'in_revisione' | 'verificato_etichetta' | 'da_identificare' | 'offers' | 'new' | 'lowstock'>('all');
  const [productSaveError, setProductSaveError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Settings form
  const [localSettings, setLocalSettings] = useState<StoreSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Push Notifications admin controls
  const [pushStats, setPushStats] = useState<{
    totalSubscribers: number;
    newArrivalsSubscribers: number;
    storeHoursSubscribers: number;
    recentHistory: any[];
  } | null>(null);
  const [pushForm, setPushForm] = useState<{
    topic: 'newArrivals' | 'storeHours' | 'all';
    title: string;
    body: string;
    url: string;
  }>({
    topic: 'newArrivals',
    title: 'Nuovi Arrivi da Mama Sam!',
    body: 'Nuove scorte fresche appena arrivate in Via Ugo Bassi 104, Messina.',
    url: '/#new-arrivals-section'
  });
  const [pushSending, setPushSending] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  const clearInMemorySession = () => {
    try {
      sessionStorage.removeItem('mamasam_admin_token');
      sessionStorage.removeItem('mamasam_admin_user');
    } catch {
      // ignore storage cleanup errors
    }
    inMemoryAdminToken = '';
    inMemoryAdminUser = null;
    setAuthToken('');
    setAdminUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    try {
      sessionStorage.removeItem('mamasam_admin_token');
      sessionStorage.removeItem('mamasam_admin_user');
    } catch {
      // ignore
    }

    if (!isOpen) return;

    if (!inMemoryAdminToken) {
      fetch('/api/admin/auth-status')
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data && typeof data.setupRequired === 'boolean') {
            setAuthSetupRequired(data.setupRequired);
          }
        })
        .catch(() => {});
    } else {
      fetchDashboardData(inMemoryAdminToken);
    }
  }, [isOpen]);

  // Authenticate single administrator account
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessNotice('');
    setAuthSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: passwordInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenziali non valide. Verifica i dati inseriti e riprova.');
      }

      inMemoryAdminToken = data.token;
      inMemoryAdminUser = data.user || null;
      setAuthToken(data.token);
      setAdminUser(data.user || null);
      setPasswordInput('');
      setIsAuthenticated(true);
      fetchDashboardData(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Credenziali non valide. Verifica i dati inseriti e riprova.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // First-run password claim (only active if no admin password has ever been configured)
  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessNotice('');
    if (claimPasswordInput !== claimConfirmInput) {
      setAuthError('Le password non coincidono.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: claimPasswordInput,
          confirmPassword: claimConfirmInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile completare la configurazione iniziale.');
      }
      inMemoryAdminToken = data.token;
      inMemoryAdminUser = data.user || null;
      setAuthToken(data.token);
      setAdminUser(data.user || null);
      setClaimPasswordInput('');
      setClaimConfirmInput('');
      setAuthSetupRequired(false);
      setIsAuthenticated(true);
      fetchDashboardData(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Errore durante la configurazione della password.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      }
    } catch (e) {
      console.warn('Logout notification error:', e);
    } finally {
      clearInMemorySession();
      setPasswordInput('');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      setPasswordChangeError('Compila tutti i campi richiesti.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('La nuova password e la conferma non coincidono.');
      return;
    }
    if (newPasswordInput.length < 10) {
      setPasswordChangeError('La nuova password deve contenere almeno 10 caratteri.');
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput,
          confirmPassword: confirmPasswordInput
        })
      });
      const data = await res.json();
      if (res.status === 401 && data.error?.includes('Session')) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile aggiornare la password.');
      }

      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      clearInMemorySession();
      setAuthError('');
      setAuthSuccessNotice(
        data.message || 'Password aggiornata con successo. Tutti gli accessi precedenti sono stati disconnessi.'
      );
    } catch (err: any) {
      setPasswordChangeError(err?.message || 'Errore durante il cambio password.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const fetchDashboardData = async (token = authToken) => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const [statsRes, ordersRes, catRes, supaRes, pushRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/categories').catch(() => null),
        fetch('/api/admin/supabase-status', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null),
        fetch('/api/push/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null)
      ]);

      if (statsRes.status === 401 || ordersRes.status === 401) {
        handleLogout();
        return;
      }

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      setStats(statsData);
      setOrders(ordersData);

      if (catRes && catRes.ok) {
        setCategoriesList(await catRes.json());
      }
      if (supaRes && supaRes.ok) {
        setSupabaseStatus(await supaRes.json());
      }
      if (pushRes && pushRes.ok) {
        setPushStats(await pushRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleRefreshSupabaseStatus = async () => {
    setSupabaseLoading(true);
    try {
      const res = await fetch('/api/admin/supabase-status', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setSupabaseStatus(await res.json());
      }
    } catch (err) {
      console.error('Failed to refresh Supabase status:', err);
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setSupabaseSyncing(true);
    setSupabaseSyncFeedback(null);
    try {
      const res = await fetch('/api/admin/supabase/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sincronizzazione fallita.');
      }
      if (data.status) {
        setSupabaseStatus(data.status);
      }
      setSupabaseSyncFeedback(
        `Sincronizzazione completata: ${data.synced?.products || 0} prodotti, ${data.synced?.categories || 0} categorie e impostazioni negozio caricati su Supabase.`
      );
    } catch (err: any) {
      setSupabaseSyncFeedback(err?.message || 'Errore durante la sincronizzazione su Supabase.');
    } finally {
      setSupabaseSyncing(false);
    }
  };

  const handleQuickVerify = async (prod: Product, nextStatus: 'da_verificare' | 'in_revisione' | 'verificato_etichetta') => {
    try {
      const res = await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ verificationStatus: nextStatus })
      });
      if (res.ok) {
        onRefreshProducts();
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Quick verification error:', e);
    }
  };

  const handleCopySql = async () => {
    try {
      const res = await fetch('/api/admin/schema-sql', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Unauthorized');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 3000);
    } catch (err) {
      console.error('Copy SQL failed:', err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: newCatName.trim(),
          summary: newCatSummary.trim()
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Errore creazione categoria');
      }
      const newCat = await res.json();
      setCategoriesList(prev => [...prev, newCat]);
      setNewCatName('');
      setNewCatSummary('');
      setIsAddingCat(false);
    } catch (err: any) {
      setCatError(err.message || 'Errore durante la creazione della categoria.');
    }
  };

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authToken]);

  // Order Status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, staffNotes?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus, staffNotes })
      });
      if (res.ok) {
        fetchDashboardData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus, staffNotes } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Product Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductSaveError(null);

    let priceVal: number | null = null;
    if (productForm.price !== undefined && productForm.price !== null && String(productForm.price).trim() !== '') {
      const parsedP = Number(productForm.price);
      if (isNaN(parsedP) || parsedP < 0) {
        setProductSaveError('Inserisci un prezzo valido (oppure lascia vuoto se il prezzo è in verifica al banco).');
        return;
      }
      priceVal = Number(parsedP.toFixed(2));
    }

    if (productForm.isDiscounted) {
      if (priceVal === null) {
        setProductSaveError('Per abilitare lo sconto, imposta prima un prezzo di vendita confermato.');
        return;
      }
      const orig = Number(productForm.originalPrice);
      if (isNaN(orig) || orig <= 0) {
        setProductSaveError('Per abilitare lo sconto, inserisci un prezzo originale valido maggiore di zero.');
        return;
      }
      if (orig <= priceVal) {
        setProductSaveError(`Il prezzo originale (€${orig.toFixed(2)}) deve essere superiore al prezzo scontato (€${priceVal.toFixed(2)}).`);
        return;
      }
    }

    if (productForm.discountStartDate && productForm.discountEndDate) {
      const start = new Date(productForm.discountStartDate);
      const end = new Date(productForm.discountEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        setProductSaveError('La data di inizio sconto non può essere successiva alla data di fine sconto.');
        return;
      }
    }

    const payload = {
      ...productForm,
      price: priceVal,
      stock: (productForm.stock !== undefined && productForm.stock !== null && String(productForm.stock).trim() !== '')
        ? Number(productForm.stock)
        : null,
      purchasePrice: (productForm.purchasePrice !== undefined && productForm.purchasePrice !== null && String(productForm.purchasePrice).trim() !== '')
        ? Number(productForm.purchasePrice)
        : null
    };

    try {
      if (isCreatingProduct) {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create product.');
        }

        setIsCreatingProduct(false);
        setProductForm({});
        onRefreshProducts();
        fetchDashboardData();
      } else if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update product.');
        }

        setEditingProduct(null);
        setProductForm({});
        onRefreshProducts();
        fetchDashboardData();
      }
    } catch (err: any) {
      console.error(err);
      setProductSaveError(err.message || 'Error saving product.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setConfirmDeleteId(null);
        onRefreshProducts();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(localSettings)
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateSettings(data);
        setSettingsSaved(true);
        fetchDashboardData();
        setTimeout(() => setSettingsSaved(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Manual Push Notification Broadcast
  const handleSendPushNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushForm.title.trim() || !pushForm.body.trim()) return;
    setPushSending(true);
    setPushFeedback(null);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(pushForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore invio notifiche');
      }
      setPushFeedback(
        `Notifica elaborata: ${data.sentCount} inviate su ${data.totalTargeted} dispositivi destinatari${data.removedCount ? ` (${data.removedCount} iscrizioni scadute rimosse)` : ''}.`
      );
      fetchDashboardData();
    } catch (err: any) {
      setPushFeedback(err?.message || 'Errore durante l’invio della notifica push.');
    } finally {
      setPushSending(false);
    }
  };

  const printReceipt = (order: Order) => {
    const printWindow = window.open('', '', 'width=600,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt - ${escapeHtml(order.orderNumber)}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 400px; margin: auto; }
            h2, h3 { text-align: center; margin: 4px 0; }
            .divider { border-bottom: 1px dashed #000; margin: 12px 0; }
            table { width: 100%; font-size: 13px; }
            td { padding: 4px 0; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>MAMA SAM SUPERMARKET</h2>
          <h3>VIA UGO BASSI 104, MESSINA</h3>
          <p style="text-align:center; font-size:12px;">Tel: ${escapeHtml(settings.phone1)}</p>
          <div class="divider"></div>
          <p><strong>ORDINE: ${escapeHtml(order.orderNumber)}</strong></p>
          <p>Data: ${escapeHtml(new Date(order.createdAt).toLocaleString('it-IT'))}</p>
          <p>Cliente: ${escapeHtml(order.customerName)}</p>
          <p>Telefono: ${escapeHtml(order.customerPhone)}</p>
          <p>Ritiro: ${escapeHtml(order.pickupTimePreference)}</p>
          <div class="divider"></div>
          <table>
            ${order.items.map(it => `
              <tr>
                <td>${Number(it.quantity)}x ${escapeHtml(it.productName)}</td>
                <td class="right">€${Number(it.lineTotal).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          <div class="divider"></div>
          <table>
            <tr>
              <td><strong>TOTALE DOVUTO:</strong></td>
              <td class="right"><strong>€${Number(order.total).toFixed(2)}</strong></td>
            </tr>
          </table>
          <p style="text-align:center; font-size:11px; margin-top:20px;">
            Solo Ritiro in Negozio · Pagamento al Ritiro<br>
            Grazie per aver scelto Mama Sam!
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Filtered orders list
  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'completed') {
        if (o.status !== 'completed' && o.status !== 'collected') return false;
      } else if (o.status !== orderStatusFilter) {
        return false;
      }
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      const matchNum = o.orderNumber?.toLowerCase().includes(q);
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-stone-50 flex flex-col overflow-hidden">
      <div className="bg-white w-full h-full flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3 bg-[#124b2e] text-white flex items-center justify-between gap-4 shrink-0 border-b border-emerald-950/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lock className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-bold text-sm sm:text-base tracking-tight whitespace-nowrap truncate">
              Portale Gestione &amp; Staff Mama Sam
            </span>
            <span className="hidden lg:inline-block text-[11px] bg-emerald-800/90 text-emerald-100 px-2.5 py-0.5 rounded font-mono whitespace-nowrap shrink-0">
              Messina Live Desk
            </span>
            {supabaseStatus?.connected ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] bg-emerald-900/90 text-emerald-100 px-2.5 py-0.5 rounded border border-emerald-400/40 whitespace-nowrap shrink-0">
                <Database className="w-3.5 h-3.5 text-emerald-300" />
                <span>Supabase Attivo</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] bg-amber-900/60 text-amber-100 px-2.5 py-0.5 rounded border border-amber-500/50 whitespace-nowrap shrink-0">
                <Server className="w-3.5 h-3.5 text-amber-300" />
                <span>Supabase in Setup</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {isAuthenticated && adminUser?.email && (
              <span className="hidden md:inline text-xs text-emerald-100 font-mono whitespace-nowrap">
                {adminUser.email}
              </span>
            )}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-xs font-semibold text-emerald-100 hover:text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Esci</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              title="Chiudi pannello e torna al negozio"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Torna al Negozio</span>
            </button>
          </div>
        </div>

        {/* Not Authenticated Screen (Clean & Minimal — Zero Demo Credentials or Hints) */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-stone-50">
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-stone-200 shadow-md max-w-md w-full text-center">
              <div className="w-12 h-12 bg-emerald-100 text-[#124b2e] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-emerald-800" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                {authSetupRequired ? 'Configurazione Password Amministratore' : 'Accesso Amministratore'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {authSetupRequired
                  ? 'Imposta la password iniziale per l’unico account amministratore del negozio.'
                  : 'Area riservata esclusivamente all’amministratore autorizzato del negozio.'}
              </p>

              {authSuccessNotice && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-left flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{authSuccessNotice}</span>
                </div>
              )}

              {authSetupRequired ? (
                <form onSubmit={handleClaimAdmin} className="space-y-4">
                  {authError && (
                    <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-left">
                      {authError}
                    </p>
                  )}

                  <div className="text-left">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nuova Password Amministratore *
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="password"
                        required
                        minLength={10}
                        autoComplete="new-password"
                        placeholder="Minimo 10 caratteri con maiuscole, numeri e simboli"
                        value={claimPasswordInput}
                        onChange={e => setClaimPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:border-[#124b2e] outline-hidden bg-white text-slate-900"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Conferma Password *
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="password"
                        required
                        minLength={10}
                        autoComplete="new-password"
                        placeholder="Ripeti la password"
                        value={claimConfirmInput}
                        onChange={e => setClaimConfirmInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:border-[#124b2e] outline-hidden bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-2.5 bg-[#124b2e] hover:bg-[#0e3b24] disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    {authSubmitting ? 'Salvataggio...' : 'Attiva Account Amministratore'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  {authError && (
                    <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-left">
                      {authError}
                    </p>
                  )}

                  <div className="text-left">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Amministratore
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        required
                        autoComplete="username"
                        placeholder="Inserisci email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:border-[#124b2e] outline-hidden bg-white text-slate-900"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="Inserisci password"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:border-[#124b2e] outline-hidden bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-2.5 bg-[#124b2e] hover:bg-[#0e3b24] disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    {authSubmitting ? 'Verifica in corso...' : 'Accedi al Pannello'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-stone-50">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-stone-200 p-3 sm:p-4 shrink-0 flex md:flex-col justify-between overflow-x-auto">
              <div className="flex md:flex-col gap-1.5 w-full min-w-max md:min-w-0">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-50 text-[#124b2e]'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Panoramica</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'orders'
                      ? 'bg-emerald-50 text-[#124b2e]'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Ordini ({orders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'products'
                      ? 'bg-emerald-50 text-[#124b2e]'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Catalogo e Foto</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'settings'
                      ? 'bg-emerald-50 text-[#124b2e]'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <Settings className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Impostazioni Negozio</span>
                </button>

                <button
                  onClick={() => setActiveTab('supabase')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'supabase'
                      ? 'bg-emerald-50 text-[#124b2e]'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="flex-1 text-left">Supabase &amp; DB</span>
                  {supabaseStatus?.connected ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Supabase Connesso"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Configurazione Richiesta"></span>
                  )}
                </button>
              </div>

              {/* Supabase backend status widget */}
              <div className="hidden md:block p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs text-emerald-950 mt-4">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                  <Database className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Backend Database</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {supabaseStatus?.connected
                    ? `PostgreSQL connesso (${supabaseStatus.tables?.products || products.length} prodotti, ${orders.length} ordini).`
                    : 'Modalità ibrida attiva. Connetti Supabase via env per RLS cloud.'}
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              
              {/* TAB 1: OVERVIEW DASHBOARD */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Today's Store Activity</h3>
                    <p className="text-xs text-slate-500">Live store metrics for Via Ugo Bassi 104, Messina</p>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white p-4 rounded-xl border border-stone-200">
                      <span className="text-[11px] text-slate-500 font-medium">Total Orders</span>
                      <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalOrders}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">{stats.todayOrdersCount} today</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-stone-200">
                      <span className="text-[11px] text-slate-500 font-medium">Recorded Volume</span>
                      <p className="text-2xl font-extrabold text-emerald-800 mt-0.5">€{stats.totalRevenue.toFixed(2)}</p>
                      <span className="text-[10px] text-slate-400">€{stats.todayRevenue.toFixed(2)} today</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-stone-200">
                      <span className="text-[11px] text-slate-500 font-medium">Pending Pickup Prep</span>
                      <p className="text-2xl font-extrabold text-amber-600 mt-0.5">
                        {stats.statusCounts.pending + stats.statusCounts.preparing}
                      </p>
                      <span className="text-[10px] text-amber-700 font-semibold">{stats.statusCounts.ready} ready now</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-stone-200">
                      <span className="text-[11px] text-slate-500 font-medium">Active Products</span>
                      <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.inventory.totalProducts}</p>
                      <span className="text-[10px] text-rose-600 font-semibold">{stats.inventory.lowStockCount} low stock</span>
                    </div>
                  </div>

                  {/* Image Accuracy & Catalog Audit Card */}
                  <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">Product Photography Audit Status</h4>
                        <p className="text-[11px] text-slate-500">
                          {stats.inventory.verifiedImagesCount || 0} verified photos · {stats.inventory.needsReviewImagesCount || 0} awaiting review · {stats.inventory.missingImagesCount || 0} placeholders
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('products')}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Audit &amp; Upload Photos
                    </button>
                  </div>

                  {/* Recent Orders quick table */}
                  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <div className="p-3.5 border-b border-stone-200 flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">Recent Customer Orders</h4>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-xs text-emerald-700 font-semibold hover:underline"
                      >
                        View All Orders →
                      </button>
                    </div>
                    <div className="divide-y divide-stone-100 text-xs">
                      {orders.slice(0, 5).map(o => (
                        <div key={o.id} className="p-3 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="text-slate-700 font-medium">{o.customerName}</span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="text-slate-500">{o.items.length} items</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900">€{o.total.toFixed(2)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              o.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                              o.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                              o.status === 'collected' ? 'bg-slate-100 text-slate-700' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDERS MANAGEMENT */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900">Customer Pickup Orders</h3>
                      <p className="text-xs text-slate-500">Manage order preparation, statuses, and receipt printing</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search orders..."
                          value={orderSearch}
                          onChange={e => setOrderSearch(e.target.value)}
                          className="pl-8 pr-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-white outline-hidden focus:border-[#124b2e]"
                        />
                      </div>
                      <select
                        value={orderStatusFilter}
                        onChange={e => setOrderStatusFilter(e.target.value)}
                        className="text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                      >
                        <option value="all">All Statuses ({orders.length})</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready for Pickup</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-stone-200">
                      No orders found under this status.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map(order => (
                        <div
                          key={order.id}
                          className="bg-white rounded-xl border border-stone-200 p-4 space-y-3 hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                            <div>
                              <span className="font-mono font-bold text-sm text-slate-900">{order.orderNumber}</span>
                              <span className="text-xs text-slate-400 ml-2">
                                {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => printReceipt(order)}
                                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Slip</span>
                              </button>
                              <span className="font-extrabold text-sm text-slate-900">
                                €{order.total.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Customer & Items detail */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                            <div>
                              <p><strong>Customer:</strong> {order.customerName}</p>
                              <p><strong>Phone:</strong> {order.customerPhone}</p>
                              {order.customerEmail && <p><strong>Email:</strong> {order.customerEmail}</p>}
                            </div>
                            <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                              <p><strong>Pickup Time:</strong> {order.pickupTimePreference}</p>
                              {order.customerNote && (
                                <p><strong>Customer Note:</strong> <span className="italic">{order.customerNote}</span></p>
                              )}
                              {order.staffNotes && (
                                <p className="text-emerald-800"><strong>Staff Note:</strong> {order.staffNotes}</p>
                              )}
                            </div>
                          </div>

                          {/* Order Items snapshot */}
                          <div className="border border-stone-100 rounded-lg overflow-hidden bg-stone-50/50 p-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                              Ordered Items ({order.items.reduce((s, it) => s + it.quantity, 0)})
                            </span>
                            <div className="space-y-1">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded overflow-hidden bg-stone-200 shrink-0">
                                      <img src={resolveImage(it.image)} alt="" className="w-full h-full object-cover" />
                                    </span>
                                    <span>{it.quantity}x {it.productName}</span>
                                    <span className="text-slate-400 text-[11px]">({it.packageSize})</span>
                                  </div>
                                  <span className="font-mono font-semibold">€{it.lineTotal.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-400">Status:</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                order.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                                order.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'completed' || order.status === 'collected' ? 'bg-slate-100 text-slate-700' :
                                order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {order.status === 'ready' ? 'Ready for Pickup' :
                                 order.status === 'preparing' ? 'Preparing' :
                                 order.status === 'confirmed' ? 'Confirmed' :
                                 order.status === 'completed' || order.status === 'collected' ? 'Completed' :
                                 order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Confirm Order
                                </button>
                              )}
                              {(order.status === 'pending' || order.status === 'confirmed') && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Mark Preparing
                                </button>
                              )}
                              {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing') && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Mark Ready for Pickup
                                </button>
                              )}
                              {order.status === 'ready' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Mark Completed
                                </button>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'collected' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                  className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PRODUCTS & INVENTORY */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900">Product Catalog &amp; Image Studio</h3>
                      <p className="text-xs text-slate-500">
                        Upload custom product photos, verify image accuracy, update pricing and inventory
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setIsAddingCat(prev => !prev)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                          isAddingCat
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-[#124b2e] border border-emerald-300'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>Gestisci Categorie ({categoriesList.length})</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsCreatingProduct(true);
                          setEditingProduct(null);
                          setProductSaveError(null);
                          setProductForm({
                            name: '',
                            category: categoriesList[0]?.name || 'Tuberi e Verdure Fresche',
                            origin: 'Importato',
                            price: 5.00,
                            originalPrice: undefined,
                            packageSize: '1 pezzo / conf.',
                            stock: 20,
                            description: '',
                            isAvailable: true,
                            image: '',
                            imageStatus: 'missing',
                            ingredients: '',
                            allergenInfo: '',
                            sku: `MS-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
                            isNewArrival: false,
                            isDiscounted: false,
                            discountActive: true,
                            discountStartDate: '',
                            discountEndDate: ''
                          });
                        }}
                        className="px-3.5 py-2 bg-[#124b2e] hover:bg-[#0e3b24] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Aggiungi Nuovo Prodotto</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Category Management Panel */}
                  {isAddingCat && (
                    <div className="p-4 bg-white rounded-xl border border-emerald-300 shadow-sm space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-700" />
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                            Gestione Categorie Reparto
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            (African &amp; Asian Groceries, Drinks, Alcohol, Noodles, Hair Products, Oils...)
                          </span>
                        </div>
                        <button
                          onClick={() => setIsAddingCat(false)}
                          className="p-1 hover:bg-stone-100 rounded-lg text-slate-400 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {catError && (
                        <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                          {catError}
                        </p>
                      )}

                      <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            required
                            placeholder="Nuova categoria (es. Asian groceries, Noodles, Alcohol, Hair Products)"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg outline-hidden focus:border-[#124b2e]"
                          />
                        </div>
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            placeholder="Descrizione / sottotitolo (opzionale)"
                            value={newCatSummary}
                            onChange={e => setNewCatSummary(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg outline-hidden focus:border-[#124b2e]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            className="w-full py-1.5 bg-[#124b2e] hover:bg-[#0e3b24] text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            + Aggiungi
                          </button>
                        </div>
                      </form>

                      {/* Active Categories Chips */}
                      <div className="pt-2 border-t border-stone-100">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                          Categorie nel Database ({categoriesList.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {categoriesList.map(cat => (
                            <span
                              key={cat.id || cat.name}
                              className="px-2.5 py-1 bg-stone-100 text-slate-800 rounded-lg text-[11px] font-medium border border-stone-200 flex items-center gap-1.5"
                            >
                              <span>{cat.name}</span>
                              {cat.itemCount !== undefined && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                                  {cat.itemCount} prod.
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search and Promotion Filters */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-semibold text-[11px] mr-1">Filtra per:</span>
                      <button
                        type="button"
                        onClick={() => setProductPromoFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          productPromoFilter === 'all'
                            ? 'bg-[#124b2e] text-white shadow-2xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
                        }`}
                      >
                        Tutti ({products.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductPromoFilter('da_verificare')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          productPromoFilter === 'da_verificare'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        Pending Verification ({products.filter(p => p.verificationStatus === 'da_verificare' || !p.verificationStatus).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductPromoFilter('da_identificare')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          productPromoFilter === 'da_identificare'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        Da Identificare ({products.filter(p => p.verificationStatus === 'da_identificare').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductPromoFilter('in_revisione')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          productPromoFilter === 'in_revisione'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        In Revisione ({products.filter(p => p.verificationStatus === 'in_revisione').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductPromoFilter('verificato_etichetta')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          productPromoFilter === 'verificato_etichetta'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        ✓ Verificati ({products.filter(p => p.verificationStatus === 'verificato_etichetta').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductPromoFilter('offers')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                          productPromoFilter === 'offers'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <Flame className="w-3 h-3 fill-current" />
                        <span>In Offerta ({products.filter(p => isProductDiscountActive(p)).length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductPromoFilter('new')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                          productPromoFilter === 'new'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Nuovi Arrivi ({products.filter(p => isProductNewArrival(p)).length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductPromoFilter('lowstock')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          productPromoFilter === 'lowstock'
                            ? 'bg-stone-800 text-white shadow-2xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-200'
                        }`}
                      >
                        Scorte Basse ({products.filter(p => p.stock !== null && p.stock !== undefined && p.stock <= 5).length})
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filtra prodotti per nome, categoria o codice SKU..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white text-xs border border-stone-200 rounded-xl focus:border-[#124b2e] outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Product Form Modal / Section */}
                  {(isCreatingProduct || editingProduct) && (
                    <div className="p-4 sm:p-5 bg-white rounded-xl border-2 border-emerald-500 shadow-md space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {isCreatingProduct ? 'Create New Product' : `Edit Product: ${editingProduct?.name}`}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            SKU: {productForm.sku || 'Auto-generated'}
                          </span>
                        </div>
                        <button
                          onClick={() => { setIsCreatingProduct(false); setEditingProduct(null); setProductSaveError(null); }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {productSaveError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>{productSaveError}</span>
                        </div>
                      )}

                      {/* Image Upload Management Section */}
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <ImageUploadDropzone
                          currentImage={productForm.image || ''}
                          imageStatus={productForm.imageStatus || 'verified'}
                          authToken={authToken}
                          onImageUploaded={(url) => {
                            setProductForm(prev => ({
                              ...prev,
                              image: url,
                              imageStatus: 'verified'
                            }));
                          }}
                          onRemoveImage={() => {
                            setProductForm(prev => ({
                              ...prev,
                              image: '',
                              imageStatus: 'missing'
                            }));
                          }}
                          onStatusChange={(newStatus) => {
                            setProductForm(prev => ({
                              ...prev,
                              imageStatus: newStatus
                            }));
                          }}
                          gallery={productForm.gallery || []}
                          onGalleryChange={(newGallery) => {
                            setProductForm(prev => ({
                              ...prev,
                              gallery: newGallery
                            }));
                          }}
                        />
                      </div>

                      <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                          <input
                            type="text"
                            required
                            value={productForm.name || ''}
                            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block font-bold text-slate-700">Categoria *</label>
                            <button
                              type="button"
                              onClick={() => setIsAddingCat(true)}
                              className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                            >
                              + Nuova Categoria
                            </button>
                          </div>
                          <select
                            value={productForm.category || (categoriesList[0]?.name || 'Farine e amidi')}
                            onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white"
                          >
                            {(() => {
                              const standardCats = [
                                'Farine e amidi',
                                'Latte e derivati',
                                'Condimenti e dadi',
                                'Noodles e pasta',
                                'Carne e pesce in scatola',
                                'Oli e grassi',
                                'Riso e cereali',
                                'Legumi e frutta a guscio',
                                'Snack e cereali',
                                'Conserve e pomodoro',
                                'Spezie e aromi',
                                'Capelli e bellezza',
                                'Cura della pelle',
                                'Saponi e igiene',
                                'Profumi'
                              ];
                              const listNames = categoriesList.map(c => c.name);
                              const combined = Array.from(new Set([...standardCats, ...listNames]));
                              return combined.map(catName => (
                                <option key={catName} value={catName}>
                                  {catName}
                                </option>
                              ));
                            })()}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Marca / Brand</label>
                          <input
                            type="text"
                            value={productForm.brand || ''}
                            onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                            placeholder="es. Mama Africa, Lion, Indomie..."
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Stato Verifica Etichetta &amp; Prezzo</label>
                          <select
                            value={productForm.verificationStatus || 'da_verificare'}
                            onChange={e => setProductForm({ ...productForm, verificationStatus: e.target.value as any })}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white font-medium"
                          >
                            <option value="da_verificare">⏳ Pending Verification (Da verificare)</option>
                            <option value="in_revisione">🔍 In revisione</option>
                            <option value="verificato_etichetta">✓ Verificato con etichetta fisica</option>
                            <option value="da_identificare">❓ Da identificare (foto/dati incerti)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Origin / Region</label>
                          <input
                            type="text"
                            value={productForm.origin || ''}
                            onChange={e => setProductForm({ ...productForm, origin: e.target.value })}
                            placeholder="e.g. Ghana / Nigeria"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Package Size / Unit</label>
                          <input
                            type="text"
                            value={productForm.packageSize || ''}
                            onChange={e => setProductForm({ ...productForm, packageSize: e.target.value })}
                            placeholder="e.g. 1 kg bag, 500g tub"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Prezzo di Vendita (€)
                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                              (lascia vuoto se ancora da confermare)
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.price !== undefined && productForm.price !== null ? productForm.price : ''}
                            onChange={e => {
                              const val = e.target.value.trim() === '' ? null : parseFloat(e.target.value);
                              setProductForm({ ...productForm, price: val });
                            }}
                            placeholder="es. 3.50 (o vuoto)"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                          {productForm.observedPrice && (
                            <div className="mt-1 flex items-center justify-between text-[11px] bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-200">
                              <span>Rilevato nel PDF: <strong>{productForm.observedPrice}</strong></span>
                              <button
                                type="button"
                                onClick={() => {
                                  const match = productForm.observedPrice?.match(/[\d]+([.,][\d]{1,2})?/);
                                  if (match) {
                                    const num = parseFloat(match[0].replace(',', '.'));
                                    if (!isNaN(num)) {
                                      setProductForm(prev => ({
                                        ...prev,
                                        price: num,
                                        verificationStatus: 'verificato_etichetta'
                                      }));
                                    }
                                  }
                                }}
                                className="ml-2 font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                              >
                                Applica e conferma
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Prezzo d'Acquisto (€)
                            <span className="text-[10px] text-emerald-800 font-normal ml-1">
                              (Riservato Admin - MAI visibile ai clienti)
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.purchasePrice !== undefined && productForm.purchasePrice !== null ? productForm.purchasePrice : ''}
                            onChange={e => {
                              const val = e.target.value.trim() === '' ? null : parseFloat(e.target.value);
                              setProductForm({ ...productForm, purchasePrice: val });
                            }}
                            placeholder="es. 1.80 (costo fornitore)"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-emerald-50/30"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Giacenza / Scorte (Unità)
                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                              (vuoto = in verifica al banco)
                            </span>
                          </label>
                          <input
                            type="number"
                            value={productForm.stock !== undefined && productForm.stock !== null ? productForm.stock : ''}
                            onChange={e => {
                              const val = e.target.value.trim() === '' ? null : parseInt(e.target.value);
                              setProductForm({ ...productForm, stock: val });
                            }}
                            placeholder="es. 15 (o vuoto)"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Codice a Barre (EAN / Barcode)</label>
                          <input
                            type="text"
                            value={productForm.barcode || ''}
                            onChange={e => setProductForm({ ...productForm, barcode: e.target.value })}
                            placeholder="es. 8001234567890 (da scansione fisica)"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
                          <input
                            type="text"
                            value={productForm.sku || ''}
                            onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                            placeholder="e.g. MS-SKU-1024"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Disponibilità Negozio</label>
                          <select
                            value={productForm.isAvailable !== false ? 'active' : 'inactive'}
                            onChange={e => setProductForm({ ...productForm, isAvailable: e.target.value === 'active' })}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white"
                          >
                            <option value="active">Attivo (Disponibile per il ritiro in cassa)</option>
                            <option value="inactive">Non attivo / Nascosto</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Ingredienti Attesi / Verificati</label>
                          <input
                            type="text"
                            value={productForm.ingredients || productForm.expectedIngredients || ''}
                            onChange={e => setProductForm({ ...productForm, ingredients: e.target.value, expectedIngredients: e.target.value })}
                            placeholder="e.g. 100% Farina di platano essiccato"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Allergeni &amp; Avvertenze Intolleranze</label>
                          <input
                            type="text"
                            value={productForm.allergenInfo || productForm.allergensAlert || ''}
                            onChange={e => setProductForm({ ...productForm, allergenInfo: e.target.value, allergensAlert: e.target.value })}
                            placeholder="e.g. Può contenere glutine o tracce di crostacei"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Note Inventario &amp; Verifica Banco</label>
                          <input
                            type="text"
                            value={productForm.notes || ''}
                            onChange={e => setProductForm({ ...productForm, notes: e.target.value })}
                            placeholder="es. Identificazione chiara dal PDF; prezzo da confermare con scontrino cassa"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Descrizione del Prodotto</label>
                          <textarea
                            rows={2}
                            value={productForm.description || ''}
                            onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                            placeholder="Descrivi ingredienti, sapore o usi culinari tradizionali..."
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                          />
                        </div>

                        {/* PROMOTIONAL & MARKETING CONTROLS */}
                        <div className="sm:col-span-2 p-4 bg-amber-50/70 rounded-xl border border-amber-200/90 space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center">
                                <Flame className="w-4 h-4 text-amber-700" />
                              </div>
                              <div>
                                <h5 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                                  Promozioni, Sconti &amp; Nuovi Arrivi
                                </h5>
                                <p className="text-[11px] text-amber-800/80">
                                  Configura sconti a tempo, date di validità e contrassegno Nuovi Arrivi
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Toggle 1: Mark as New Arrival */}
                            <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <label htmlFor="isNewArrivalToggle" className="font-bold text-slate-900 text-xs flex items-center gap-1.5 cursor-pointer">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Contrassegna come Nuovo Arrivo</span>
                                </label>
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  Mostra nella vetrina "Nuovi Arrivi" in homepage con badge "NUOVO".
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                <input
                                  id="isNewArrivalToggle"
                                  type="checkbox"
                                  checked={Boolean(productForm.isNewArrival)}
                                  onChange={e => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#124b2e]"></div>
                              </label>
                            </div>

                            {/* Toggle 2: Enable Discount */}
                            <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <label htmlFor="isDiscountedToggle" className="font-bold text-slate-900 text-xs flex items-center gap-1.5 cursor-pointer">
                                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Abilita Sconto Promozionale</span>
                                </label>
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  Mostra nella sezione "Offerte Speciali" con prezzo originale barrato e badge -%.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                <input
                                  id="isDiscountedToggle"
                                  type="checkbox"
                                  checked={Boolean(productForm.isDiscounted)}
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    setProductForm({ 
                                      ...productForm, 
                                      isDiscounted: checked,
                                      discountActive: checked ? (productForm.discountActive !== false) : false
                                    });
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                              </label>
                            </div>
                          </div>

                          {/* DISCOUNT DETAILS & SCHEDULING (shown if discount is enabled) */}
                          {productForm.isDiscounted && (
                            <div className="p-3.5 bg-white rounded-xl border border-rose-200 space-y-3.5">
                              
                              {/* Promotion Active Toggle */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                                <div>
                                  <span className="font-bold text-slate-800 text-xs">Stato Attivazione Promozione</span>
                                  <p className="text-[11px] text-slate-500">
                                    Attiva o disattiva l'offerta senza cancellare i prezzi impostati.
                                  </p>
                                </div>
                                <select
                                  value={productForm.discountActive !== false ? 'active' : 'inactive'}
                                  onChange={e => setProductForm({ ...productForm, discountActive: e.target.value === 'active' })}
                                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-hidden cursor-pointer ${
                                    productForm.discountActive !== false
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-stone-100 text-stone-700 border-stone-300'
                                  }`}
                                >
                                  <option value="active">🟢 Promozione Attiva</option>
                                  <option value="inactive">⚪ Sospesa / Disattivata</option>
                                </select>
                              </div>

                              {/* Prices Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">
                                    Prezzo Originale Pieno (€) *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required={productForm.isDiscounted}
                                    value={productForm.originalPrice != null ? productForm.originalPrice : ''}
                                    onChange={e => {
                                      const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                      setProductForm({ ...productForm, originalPrice: val });
                                    }}
                                    placeholder="es. 8.00"
                                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:border-rose-500 outline-hidden"
                                  />
                                  <span className="text-[10px] text-slate-400">Prezzo pieno precedente (mostrato barrato)</span>
                                </div>

                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">
                                    Prezzo Scontato Promozionale (€) *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={productForm.price != null ? productForm.price : ''}
                                    onChange={e => setProductForm({ ...productForm, price: e.target.value ? parseFloat(e.target.value) : null })}
                                    placeholder="es. 6.50"
                                    className="w-full px-3 py-1.5 text-xs font-bold text-emerald-900 bg-stone-50 border border-stone-300 rounded-lg focus:border-emerald-600 outline-hidden"
                                  />
                                  <span className="text-[10px] text-slate-400">Prezzo effettivo pagato dal cliente</span>
                                </div>
                              </div>

                              {/* Live Discount Calculation Feedback */}
                              {(() => {
                                const orig = Number(productForm.originalPrice);
                                const curr = Number(productForm.price);
                                if (orig > 0 && curr > 0) {
                                  if (orig > curr) {
                                    const pct = Math.round(((orig - curr) / orig) * 100);
                                    const savings = (orig - curr).toFixed(2);
                                    return (
                                      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-white bg-rose-600 px-2 py-0.5 rounded text-[11px]">
                                            -{pct}% SCONTO
                                          </span>
                                          <span>Il cliente risparmia <strong>€{savings}</strong> per unità</span>
                                        </div>
                                        <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">Calcolo verificato</span>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                        <span>Attenzione: Il prezzo originale (€{orig}) deve essere superiore al prezzo scontato (€{curr}).</span>
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              })()}

                              {/* Dates Scheduling */}
                              <div className="pt-2 border-t border-stone-100">
                                <label className="block font-bold text-slate-800 text-xs mb-1">
                                  Programmazione Date Validità Sconto (Opzionale)
                                </label>
                                <p className="text-[11px] text-slate-500 mb-2">
                                  Lo sconto si attiva e scade automaticamente in base a queste date. Senza date, rimane sempre attivo finché non lo disattivi.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <label className="block text-slate-600 font-medium mb-1">Data Inizio Sconto</label>
                                    <input
                                      type="date"
                                      value={productForm.discountStartDate || ''}
                                      onChange={e => setProductForm({ ...productForm, discountStartDate: e.target.value })}
                                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-slate-600 font-medium mb-1">Data Fine Sconto (Scadenza)</label>
                                    <input
                                      type="date"
                                      value={productForm.discountEndDate || ''}
                                      onChange={e => setProductForm({ ...productForm, discountEndDate: e.target.value })}
                                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg"
                                    />
                                  </div>
                                </div>

                                {/* Quick Date Presets */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10.5px]">
                                  <span className="text-slate-400">Scorciatoie:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const start = new Date().toISOString().split('T')[0];
                                      const end = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
                                      setProductForm({ ...productForm, discountStartDate: start, discountEndDate: end });
                                    }}
                                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-slate-700 cursor-pointer"
                                  >
                                    +7 giorni
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const start = new Date().toISOString().split('T')[0];
                                      const end = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
                                      setProductForm({ ...productForm, discountStartDate: start, discountEndDate: end });
                                    }}
                                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-slate-700 cursor-pointer"
                                  >
                                    +14 giorni
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const start = new Date().toISOString().split('T')[0];
                                      const end = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
                                      setProductForm({ ...productForm, discountStartDate: start, discountEndDate: end });
                                    }}
                                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-slate-700 cursor-pointer"
                                  >
                                    +30 giorni
                                  </button>
                                  {(productForm.discountStartDate || productForm.discountEndDate) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProductForm({ ...productForm, discountStartDate: '', discountEndDate: '' });
                                      }}
                                      className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                                    >
                                      Rimuovi date
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => { setIsCreatingProduct(false); setEditingProduct(null); setProductSaveError(null); }}
                            className="px-3 py-1.5 border border-stone-300 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-[#124b2e] hover:bg-[#0e3b24] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Product &amp; Image</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Products Table */}
                  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden text-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-200 text-slate-600 font-bold">
                          <tr>
                            <th className="p-3">Foto &amp; Prodotto</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Prezzo &amp; Costo</th>
                            <th className="p-3">Giacenza</th>
                            <th className="p-3">Verifica Etichetta</th>
                            <th className="p-3">Promozioni &amp; Badge</th>
                            <th className="p-3">Stato</th>
                            <th className="p-3 text-right">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {products
                            .filter(p => {
                              if (productSearch) {
                                const q = productSearch.toLowerCase().trim();
                                const matchesSearch = (
                                  p.name.toLowerCase().includes(q) ||
                                  p.category.toLowerCase().includes(q) ||
                                  (p.brand && p.brand.toLowerCase().includes(q)) ||
                                  (p.sku && p.sku.toLowerCase().includes(q)) ||
                                  (p.barcode && p.barcode.toLowerCase().includes(q))
                                );
                                if (!matchesSearch) return false;
                              }
                              if (productPromoFilter === 'offers') {
                                return isProductDiscountActive(p) || p.isDiscounted || (p.originalPrice && p.price !== null && p.originalPrice > p.price);
                              }
                              if (productPromoFilter === 'new') {
                                return isProductNewArrival(p);
                              }
                              if (productPromoFilter === 'lowstock') {
                                return p.stock !== null && p.stock !== undefined && p.stock <= 5;
                              }
                              if (productPromoFilter === 'da_verificare') {
                                return p.verificationStatus === 'da_verificare' || !p.verificationStatus;
                              }
                              if (productPromoFilter === 'da_identificare') {
                                return p.verificationStatus === 'da_identificare';
                              }
                              if (productPromoFilter === 'in_revisione') {
                                return p.verificationStatus === 'in_revisione';
                              }
                              if (productPromoFilter === 'verificato_etichetta') {
                                return p.verificationStatus === 'verificato_etichetta';
                              }
                              return true;
                            })
                            .map(prod => {
                              const promoStatus = getPromotionScheduleStatus(prod);
                              const hasDiscount = isProductDiscountActive(prod);
                              const isNew = isProductNewArrival(prod);

                              return (
                                <tr key={prod.id} className="hover:bg-stone-50/60">
                                  <td className="p-3 font-semibold text-slate-900 max-w-xs">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                        <OptimizedImage
                                          src={resolveProductImage(prod)}
                                          alt={prod.name}
                                          width={80}
                                          height={80}
                                          widths={[80, 160]}
                                          sizes="40px"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="truncate">
                                        <div className="flex items-center gap-1.5">
                                          {prod.itemNumber && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded">
                                              #{prod.itemNumber}
                                            </span>
                                          )}
                                          <span className="block truncate font-bold text-slate-900">{prod.name}</span>
                                        </div>
                                        <span className="block text-[11px] text-slate-500 font-normal">
                                          {prod.brand && <strong className="text-slate-700">{prod.brand} · </strong>}
                                          {prod.packageSize || 'Dimensione standard'} {prod.sku && `· ${prod.sku}`}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600 font-medium">{prod.category}</td>
                                  <td className="p-3">
                                    {prod.price != null ? (
                                      <div className="font-extrabold text-slate-900">
                                        €{prod.price.toFixed(2)}
                                      </div>
                                    ) : (
                                      <div className="text-[11px] font-medium text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                                        {prod.observedPrice ? `Rilevato: ${prod.observedPrice}` : 'Prezzo da confermare'}
                                      </div>
                                    )}
                                    {hasDiscount && prod.originalPrice && prod.price != null && prod.originalPrice > prod.price && (
                                      <div className="text-[11px] text-slate-400 line-through">
                                        €{prod.originalPrice.toFixed(2)}
                                      </div>
                                    )}
                                    {prod.purchasePrice != null && (
                                      <span className="text-[10px] text-emerald-800 font-mono block mt-0.5">
                                        Acq: €{prod.purchasePrice.toFixed(2)}
                                      </span>
                                    )}
                                  </td>

                                  <td className="p-3">
                                    {prod.stock != null ? (
                                      <span className={`font-bold ${prod.stock === 0 ? 'text-amber-700' : prod.stock <= 5 ? 'text-rose-600' : 'text-slate-700'}`}>
                                        {prod.stock === 0 && prod.verificationStatus !== 'verificato_etichetta'
                                          ? '0 unità (da contare)'
                                          : `${prod.stock} unità`}
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 italic text-[11px]">
                                        In verifica al banco
                                      </span>
                                    )}
                                  </td>

                                  <td className="p-3">
                                    <div className="flex flex-col items-start gap-1">
                                      {prod.verificationStatus === 'verificato_etichetta' ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          ✓ Verificato Etichetta
                                        </span>
                                      ) : prod.verificationStatus === 'da_identificare' ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                          ❓ Pending (Da Identificare)
                                        </span>
                                      ) : prod.verificationStatus === 'in_revisione' ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                          🔍 In Revisione
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                          ⏳ Pending Verification
                                        </span>
                                      )}
                                      {prod.verificationStatus !== 'verificato_etichetta' && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickVerify(prod, 'verificato_etichetta')}
                                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                                        >
                                          ✓ Conferma
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Promozioni & Badge */}
                                  <td className="p-3">
                                    <div className="flex flex-col gap-1 items-start">
                                      {isNew && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#124b2e] text-white inline-flex items-center gap-1 shadow-2xs">
                                          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                                          <span>Nuovo Arrivo</span>
                                        </span>
                                      )}

                                      {(prod.isDiscounted || (prod.originalPrice && prod.price !== null && prod.originalPrice > prod.price)) ? (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${promoStatus.badgeClass}`}>
                                          <Flame className="w-2.5 h-2.5" />
                                          <span>
                                            {prod.originalPrice && prod.price !== null && prod.originalPrice > prod.price 
                                              ? `-${calculateDiscountPercentage(prod.originalPrice, prod.price)}% ` 
                                              : ''}
                                            {promoStatus.label}
                                          </span>
                                        </span>
                                      ) : null}

                                      {!isNew && !prod.isDiscounted && !prod.originalPrice && (
                                        <span className="text-slate-400 text-[11px]">—</span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      prod.isAvailable !== false
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {prod.isAvailable !== false ? 'Attivo' : 'Non disp.'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingProduct(prod);
                                        setIsCreatingProduct(false);
                                        setProductSaveError(null);
                                        setProductForm(prod);
                                      }}
                                      className="px-2.5 py-1.5 text-slate-700 hover:text-emerald-800 bg-stone-100 hover:bg-emerald-50 rounded-lg cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                                      title="Edit product and details"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span className="text-[11px] font-semibold">Modifica</span>
                                    </button>
                                    {confirmDeleteId === prod.id ? (
                                      <span className="inline-flex items-center gap-1 ml-1">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteProduct(prod.id)}
                                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap"
                                        >
                                          Elimina
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="px-2 py-1.5 bg-stone-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                                        >
                                          No
                                        </button>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(prod.id)}
                                        className="px-2.5 py-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                                        title="Elimina prodotto"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-semibold">Elimina</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: STORE SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-5 w-full max-w-6xl">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900">Website &amp; Storefront Settings</h3>
                    <p className="text-xs text-slate-500">Update top announcement strip, contact numbers, store hours, and customer push notifications</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <form onSubmit={handleSaveSettings} className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 text-xs">
                    {settingsSaved && (
                      <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Settings successfully saved and published!</span>
                      </div>
                    )}

                    {/* Announcement Banner */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-800">Top Announcement Banner Text</label>
                        <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localSettings.announcementActive}
                            onChange={e => setLocalSettings({ ...localSettings, announcementActive: e.target.checked })}
                          />
                          <span>Show Banner</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={localSettings.announcement}
                        onChange={e => setLocalSettings({ ...localSettings, announcement: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                      />
                    </div>

                    {/* Phone 1 */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Primary Store Phone</label>
                      <input
                        type="text"
                        value={localSettings.phone1}
                        onChange={e => setLocalSettings({ ...localSettings, phone1: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">WhatsApp Ordering Number (Digits only)</label>
                      <input
                        type="text"
                        value={localSettings.whatsappNumber}
                        onChange={e => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                      />
                    </div>

                    {/* Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Monday - Saturday Hours</label>
                        <input
                          type="text"
                          value={localSettings.hoursMonSat}
                          onChange={e => setLocalSettings({ ...localSettings, hoursMonSat: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Sunday Hours</label>
                        <input
                          type="text"
                          value={localSettings.hoursSun}
                          onChange={e => setLocalSettings({ ...localSettings, hoursSun: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#124b2e] hover:bg-[#0e3b24] text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save &amp; Update Live Storefront</span>
                    </button>
                  </form>

                  {/* PUSH NOTIFICATIONS BROADCAST & SUBSCRIBER MONITOR */}
                  <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 text-xs">
                    <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#124b2e] flex items-center justify-center shrink-0">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">Notifiche Push Clienti</h4>
                          <p className="text-[11px] text-slate-500">
                            I clienti ricevono automaticamente avvisi quando modifichi gli orari o aggiungi un Nuovo Arrivo.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-center">
                        <span className="block text-[10px] text-slate-500 font-semibold uppercase">Iscritti Totali</span>
                        <span className="text-base font-extrabold text-slate-900">
                          {pushStats?.totalSubscribers ?? 0}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-center">
                        <span className="block text-[10px] text-emerald-800 font-semibold uppercase">Nuovi Arrivi</span>
                        <span className="text-base font-extrabold text-[#124b2e]">
                          {pushStats?.newArrivalsSubscribers ?? 0}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-center">
                        <span className="block text-[10px] text-amber-800 font-semibold uppercase">Orari Negozio</span>
                        <span className="text-base font-extrabold text-amber-900">
                          {pushStats?.storeHoursSubscribers ?? 0}
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSendPushNotification} className="space-y-3 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPushForm({
                            topic: 'newArrivals',
                            title: 'Nuovi Arrivi da Mama Sam!',
                            body: 'Nuove scorte fresche appena arrivate in Via Ugo Bassi 104, Messina.',
                            url: '/#new-arrivals-section'
                          })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-[11px] border border-emerald-200 cursor-pointer"
                        >
                          Modello: Nuovi Arrivi
                        </button>
                        <button
                          type="button"
                          onClick={() => setPushForm({
                            topic: 'storeHours',
                            title: 'Aggiornamento Orari · Mama Sam',
                            body: `Orari aggiornati: Lun–Sab ${localSettings.hoursMonSat} · Dom ${localSettings.hoursSun}`,
                            url: '/#location-section'
                          })}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-[11px] border border-amber-200 cursor-pointer"
                        >
                          Modello: Cambio Orari
                        </button>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Destinatari</label>
                        <select
                          value={pushForm.topic}
                          onChange={e => setPushForm({ ...pushForm, topic: e.target.value as any })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        >
                          <option value="newArrivals">Solo iscritti a Nuovi Arrivi</option>
                          <option value="storeHours">Solo iscritti a Variazioni Orari</option>
                          <option value="all">Tutti gli iscritti alle notifiche</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Titolo Notifica</label>
                        <input
                          type="text"
                          required
                          maxLength={120}
                          value={pushForm.title}
                          onChange={e => setPushForm({ ...pushForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Messaggio</label>
                        <textarea
                          rows={2}
                          required
                          maxLength={260}
                          value={pushForm.body}
                          onChange={e => setPushForm({ ...pushForm, body: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                        />
                      </div>

                      {pushFeedback && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                          {pushFeedback}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={pushSending}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{pushSending ? 'Invio in corso...' : 'Invia Notifica Push Ora'}</span>
                      </button>
                    </form>
                  </div>
                  </div>

                  {/* SINGLE ADMINISTRATOR PASSWORD MANAGEMENT */}
                  <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#124b2e] flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">Sicurezza Account Amministratore &amp; Cambio Password</h4>
                          <p className="text-[11px] text-slate-500">
                            Account unico autorizzato: <span className="font-mono font-semibold text-slate-700">{adminUser?.email || 'Amministratore Principale'}</span>. Dopo la modifica, tutte le sessioni attive vengono disconnesse.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Password Attuale *</label>
                        <input
                          type="password"
                          required
                          autoComplete="current-password"
                          value={currentPasswordInput}
                          onChange={e => setCurrentPasswordInput(e.target.value)}
                          placeholder="Password attuale"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Nuova Password *</label>
                        <input
                          type="password"
                          required
                          minLength={10}
                          autoComplete="new-password"
                          value={newPasswordInput}
                          onChange={e => setNewPasswordInput(e.target.value)}
                          placeholder="Min. 10 caratteri"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Conferma Nuova Password *</label>
                        <input
                          type="password"
                          required
                          minLength={10}
                          autoComplete="new-password"
                          value={confirmPasswordInput}
                          onChange={e => setConfirmPasswordInput(e.target.value)}
                          placeholder="Ripeti la nuova password"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div className="md:col-span-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <span className="font-semibold text-slate-800">Requisiti password sicura:</span>
                        <span className={newPasswordInput.length >= 10 ? 'text-emerald-700 font-semibold' : ''}>
                          {newPasswordInput.length >= 10 ? '✓' : '•'} 10+ caratteri
                        </span>
                        <span className={/[A-Z]/.test(newPasswordInput) ? 'text-emerald-700 font-semibold' : ''}>
                          {/[A-Z]/.test(newPasswordInput) ? '✓' : '•'} Maiuscola
                        </span>
                        <span className={/[a-z]/.test(newPasswordInput) ? 'text-emerald-700 font-semibold' : ''}>
                          {/[a-z]/.test(newPasswordInput) ? '✓' : '•'} Minuscola
                        </span>
                        <span className={/[0-9]/.test(newPasswordInput) ? 'text-emerald-700 font-semibold' : ''}>
                          {/[0-9]/.test(newPasswordInput) ? '✓' : '•'} Numero
                        </span>
                        <span className={/[^A-Za-z0-9]/.test(newPasswordInput) ? 'text-emerald-700 font-semibold' : ''}>
                          {/[^A-Za-z0-9]/.test(newPasswordInput) ? '✓' : '•'} Simbolo (!@#$)
                        </span>
                        <span className={newPasswordInput && newPasswordInput === confirmPasswordInput ? 'text-emerald-700 font-semibold' : ''}>
                          {newPasswordInput && newPasswordInput === confirmPasswordInput ? '✓' : '•'} Conferma identica
                        </span>
                      </div>

                      {passwordChangeError && (
                        <div className="md:col-span-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-medium">
                          {passwordChangeError}
                        </div>
                      )}

                      {passwordChangeSuccess && (
                        <div className="md:col-span-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-medium">
                          {passwordChangeSuccess}
                        </div>
                      )}

                      <div className="md:col-span-3 flex justify-end">
                        <button
                          type="submit"
                          disabled={passwordChangeLoading}
                          className="px-5 py-2.5 bg-[#124b2e] hover:bg-[#0e3b24] disabled:opacity-60 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>{passwordChangeLoading ? 'Aggiornamento...' : 'Aggiorna Password Amministratore'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 5: SUPABASE BACKEND MANAGEMENT */}
              {activeTab === 'supabase' && (
                <div className="space-y-6 w-full max-w-6xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                        <Database className="w-5 h-5 text-emerald-700" />
                        <span>Integrazione Backend Supabase (PostgreSQL &amp; Storage)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Stato connessione, migrazioni database con Row Level Security (RLS) e policy storage
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRefreshSupabaseStatus}
                        disabled={supabaseLoading}
                        className="px-3 py-1.5 bg-white border border-stone-300 hover:border-emerald-600 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
                      >
                        <Server className={`w-3.5 h-3.5 text-emerald-700 ${supabaseLoading ? 'animate-spin' : ''}`} />
                        <span>{supabaseLoading ? 'Verifica in corso...' : 'Testa Connessione Ora'}</span>
                      </button>

                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#124b2e] hover:bg-[#0e3b24] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <span>Dashboard Supabase</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Connection Status Banner */}
                  {supabaseStatus?.connected ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-emerald-950 text-sm">Supabase PostgreSQL Connesso e Operativo</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 uppercase">
                                Cloud Live
                              </span>
                            </div>
                            <p className="text-xs text-emerald-800 mt-0.5">
                              Istanza: <code className="bg-emerald-100/80 px-1 py-0.5 rounded font-mono text-[11px]">{supabaseStatus.url}</code>
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs text-emerald-900 border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-200">
                          <span className="font-semibold">Storage: Bucket 'product-images'</span>
                          <span className="text-[11px] text-emerald-700 font-mono">
                            {supabaseStatus.tables?.products ?? 0} Prodotti · {supabaseStatus.tables?.categories ?? 0} Cat · {supabaseStatus.tables?.orders ?? 0} Ordini
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/80">
                        <span className="text-[11px] text-emerald-800">
                          Hai appena collegato un nuovo account Supabase? Popola o aggiorna le tabelle cloud dai dati locali in 1 clic.
                        </span>
                        <button
                          type="button"
                          onClick={handleSyncToSupabase}
                          disabled={supabaseSyncing}
                          className="px-3 py-1.5 bg-[#124b2e] hover:bg-[#0e3b24] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Database className={`w-3.5 h-3.5 ${supabaseSyncing ? 'animate-spin' : ''}`} />
                          <span>{supabaseSyncing ? 'Sincronizzazione...' : 'Sincronizza Catalogo & Impostazioni'}</span>
                        </button>
                      </div>
                      {supabaseSyncFeedback && (
                        <p className="text-xs font-semibold text-emerald-900 bg-white/80 px-3 py-2 rounded-xl border border-emerald-200">
                          {supabaseSyncFeedback}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-amber-950 text-sm">
                              {supabaseStatus?.apiReachable ? 'Tabelle Database Non Ancora Create' : 'Configurazione Supabase in Attesa'}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                              Zero-Downtime Attivo
                            </span>
                          </div>
                          <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                            {supabaseStatus?.reason || 'Credenziali Supabase non ancora rilevate nelle variabili d\'ambiente.'}
                          </p>
                          <p className="text-[11px] text-amber-800 mt-1">
                            Il negozio è attualmente <strong>100% operativo</strong> tramite fallback duraturo. Una volta impostate le chiavi nell'ambiente ed eseguito lo script SQL, premi «Testa Connessione Ora».
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        {sqlCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        <span>{sqlCopied ? 'SQL Copiato!' : 'Copia Script SQL'}</span>
                      </button>
                    </div>
                  )}

                  {/* 1-Click SQL & Migration Box */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-[#124b2e]" />
                          <span>Script SQL di Migrazione Completo (`supabase/schema.sql`)</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Crea le tabelle, chiavi esterne, policy RLS, trigger e bucket Storage `product-images` con 1 clic.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#124b2e] border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {sqlCopied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-emerald-700" />}
                        <span>{sqlCopied ? 'Copiato negli Appunti!' : 'Copia Tutto lo Script SQL'}</span>
                      </button>
                    </div>

                    <div className="bg-stone-900 text-stone-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40 leading-relaxed border border-stone-800">
                      <p className="text-emerald-400 font-bold mb-1">-- Anteprima DDL Supabase PostgreSQL con RLS --</p>
                      <p className="text-stone-400">CREATE TABLE IF NOT EXISTS public.products (id TEXT PRIMARY KEY, name TEXT NOT NULL, ...);</p>
                      <p className="text-stone-400">CREATE TABLE IF NOT EXISTS public.orders (id TEXT PRIMARY KEY, order_number TEXT UNIQUE, ...);</p>
                      <p className="text-stone-400">CREATE TABLE IF NOT EXISTS public.user_roles (user_id UUID REFERENCES auth.users, role TEXT);</p>
                      <p className="text-stone-400">ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;</p>
                      <p className="text-stone-400">CREATE POLICY "products_public_select" ON public.products FOR SELECT USING (true);</p>
                      <p className="text-stone-400">CREATE POLICY "products_admin_all" ON public.products FOR ALL USING (public.is_admin());</p>
                    </div>
                  </div>

                  {/* Schema & RLS Matrix */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Tabelle Database &amp; Regole di Sicurezza Row Level Security (RLS)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Ogni tabella applica il principio del minimo privilegio. I clienti non possono vedere ordini altrui né modificare prodotti.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">products</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">RLS Attivo</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">Lettura pubblica di catalogo, disponibilità e promozioni. Modifica/eliminazione riservata agli admin.</p>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">categories</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">RLS Attivo</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">African &amp; Asian groceries, bevande, noodles, oli, cosmetici afro. Gestione dinamica admin.</p>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">orders</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">RLS Attivo</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">Inserimento ordini dal carrello (solo ritiro in negozio). Visualizzazione e cambio stato solo admin.</p>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">order_items</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">RLS Attivo</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">Snapshot immutabile di prezzi calcolati dal server e quantità ordinate al momento del checkout.</p>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">user_roles</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">RBAC Protetto</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">Ruolo admin collegato ad auth.users. Auto-promozione bloccata da security definer `is_admin()`.</p>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">product-images</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Storage Bucket</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">Bucket pubblico per servire foto con CDN. Upload e cancellazione consentiti solo agli admin.</p>
                      </div>
                    </div>
                  </div>

                  {/* Admin User Provisioning Guide */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-[#124b2e]" />
                      <span>Configurazione Account Amministratore Unico</span>
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Per garantire la massima sicurezza, non esiste alcuna registrazione pubblica e il sistema consente un solo account amministratore configurato dal proprietario su Supabase:
                    </p>

                    <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside bg-stone-50 p-4 rounded-xl border border-stone-200">
                      <li>
                        <strong>Crea l'unico utente amministratore:</strong> Vai nella console Supabase su <em>Authentication &gt; Users &gt; Add User &gt; Create User</em> usando la tua email amministratore e una password complessa.
                      </li>
                      <li>
                        <strong>Copia lo User UID:</strong> Dalla lista utenti di Supabase, copia l'UUID dell'utente appena creato.
                      </li>
                      <li>
                        <strong>Assegna il Ruolo Admin:</strong> Apri il <em>SQL Editor</em> in Supabase ed esegui la query:
                        <div className="bg-stone-900 text-emerald-400 p-2.5 rounded-lg mt-1 font-mono text-[11px]">
                          INSERT INTO public.user_roles (user_id, role) VALUES ('&lt;INCOLLA_USER_UUID&gt;', 'admin') ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
                        </div>
                      </li>
                      <li>
                        <strong>Accedi al Pannello:</strong> Accedi con l'email amministratore autorizzata; puoi cambiare la password in qualsiasi momento dalla scheda <em>Impostazioni Negozio</em>.
                      </li>
                    </ol>
                  </div>

                  {/* Required Environment Variables Checklist */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-emerald-700" />
                      <span>Variabili d'Ambiente Richieste (`.env`)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Aggiungi queste variabili al tuo file di ambiente o impostazioni del server:
                    </p>

                    <div className="space-y-2 font-mono text-xs">
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900">VITE_SUPABASE_URL</span>
                          <p className="text-[11px] text-slate-500 font-sans mt-0.5">L'URL del tuo progetto Supabase (es. https://xyz.supabase.co)</p>
                        </div>
                        <span className="text-[10px] bg-stone-200 text-slate-700 font-bold px-2 py-0.5 rounded">Client &amp; Server</span>
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900">VITE_SUPABASE_ANON_KEY</span>
                          <p className="text-[11px] text-slate-500 font-sans mt-0.5">La chiave pubblica anonima per le query frontend protette da RLS</p>
                        </div>
                        <span className="text-[10px] bg-stone-200 text-slate-700 font-bold px-2 py-0.5 rounded">Client &amp; Server</span>
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900">SUPABASE_SERVICE_ROLE_KEY</span>
                          <p className="text-[11px] text-slate-500 font-sans mt-0.5">La chiave con privilegi elevati (usata SOLO lato server, mai esposta nel frontend)</p>
                        </div>
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">Server-Only</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
