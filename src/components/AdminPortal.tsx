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
  Tag
} from 'lucide-react';
import { Product, Order, OrderStatus, StoreSettings, ProductCategory } from '../types';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import { resolveImage } from '../utils/imageHelper';
import { 
  isProductDiscountActive, 
  isProductNewArrival, 
  calculateDiscountPercentage, 
  getPromotionScheduleStatus,
  formatDateToItalian 
} from '../utils/promotionsHelper';

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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem('mamasam_admin_token');
  });
  const [authToken, setAuthToken] = useState<string>(() => {
    return sessionStorage.getItem('mamasam_admin_token') || '';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'settings'>('dashboard');

  // Stats & Orders
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Product Editing / Creation
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [productSearch, setProductSearch] = useState('');
  const [productPromoFilter, setProductPromoFilter] = useState<'all' | 'offers' | 'new' | 'lowstock'>('all');
  const [productSaveError, setProductSaveError] = useState<string | null>(null);

  // Settings form
  const [localSettings, setLocalSettings] = useState<StoreSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Authenticate
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuthToken(data.token);
      sessionStorage.setItem('mamasam_admin_token', data.token);
      setIsAuthenticated(true);
      fetchDashboardData(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Incorrect password.');
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
      sessionStorage.removeItem('mamasam_admin_token');
      setAuthToken('');
      setIsAuthenticated(false);
    }
  };

  const fetchDashboardData = async (token = authToken) => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.status === 401 || ordersRes.status === 401) {
        handleLogout();
        return;
      }

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      setStats(statsData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
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

    const price = Number(productForm.price);
    if (isNaN(price) || price < 0) {
      setProductSaveError('Inserisci un prezzo valido.');
      return;
    }

    if (productForm.isDiscounted) {
      const orig = Number(productForm.originalPrice);
      if (isNaN(orig) || orig <= 0) {
        setProductSaveError('Per abilitare lo sconto, inserisci un prezzo originale valido maggiore di zero.');
        return;
      }
      if (orig <= price) {
        setProductSaveError(`Il prezzo originale (€${orig.toFixed(2)}) deve essere superiore al prezzo scontato (€${price.toFixed(2)}).`);
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

    try {
      if (isCreatingProduct) {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify(productForm)
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
          body: JSON.stringify(productForm)
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
    if (!confirm('Are you sure you want to remove this product from the catalog?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
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
        setTimeout(() => setSettingsSaved(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const printReceipt = (order: Order) => {
    const printWindow = window.open('', '', 'width=600,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt - ${order.orderNumber}</title>
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
          <p style="text-align:center; font-size:12px;">Tel: ${settings.phone1}</p>
          <div class="divider"></div>
          <p><strong>ORDINE: ${order.orderNumber}</strong></p>
          <p>Data: ${new Date(order.createdAt).toLocaleString('it-IT')}</p>
          <p>Cliente: ${order.customerName}</p>
          <p>Telefono: ${order.customerPhone}</p>
          <p>Ritiro: ${order.pickupTimePreference}</p>
          <div class="divider"></div>
          <table>
            ${order.items.map(it => `
              <tr>
                <td>${it.quantity}x ${it.productName}</td>
                <td class="right">€${it.lineTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          <div class="divider"></div>
          <table>
            <tr>
              <td><strong>TOTALE DOVUTO:</strong></td>
              <td class="right"><strong>€${order.total.toFixed(2)}</strong></td>
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
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-[#124b2e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-emerald-300" />
            <span className="font-bold text-sm tracking-tight">Portale Gestione &amp; Staff Mama Sam</span>
            <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
              Messina Live Desk
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-700/50">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>Sicurezza Attiva</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs text-emerald-200 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Esci</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Authenticated Screen */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-stone-50">
            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-md max-w-sm w-full text-center">
              <div className="w-12 h-12 bg-emerald-100 text-[#124b2e] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-emerald-800" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">Accesso Gestionale Negozio</h3>
              <p className="text-xs text-slate-500 mb-5">
                Riservato esclusivamente al personale del negozio Mama Sam. Verifica sessione sicura con protezione da tentativi ripetuti.
              </p>

              <form onSubmit={handleLogin} className="space-y-3">
                {authError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-left">
                    {authError}
                  </p>
                )}
                <input
                  type="password"
                  placeholder="Inserisci password negozio (es. mamasam2026)"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-stone-300 rounded-xl focus:border-[#124b2e] outline-hidden"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#124b2e] hover:bg-[#0e3b24] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer"
                >
                  Accedi al Pannello
                </button>
                <div className="bg-stone-50 p-2 rounded-lg border border-stone-200 text-left text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Nota di Sicurezza:</p>
                  <p>• Blocco IP temporaneo dopo 5 tentativi errati.</p>
                  <p>• Password predefinita: <code className="bg-stone-200 px-1 py-0.5 rounded font-mono">mamasam2026</code></p>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-stone-50">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-56 bg-white border-r border-stone-200 p-3 shrink-0 flex md:flex-col justify-between overflow-x-auto">
              <div className="flex md:flex-col gap-1 w-full">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-50 text-[#124b2e]'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                  <span>Panoramica</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-emerald-50 text-[#124b2e]'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  <span>Ordini ({orders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-emerald-50 text-[#124b2e]'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <Package className="w-4 h-4 text-emerald-700" />
                  <span>Catalogo e Foto</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-emerald-50 text-[#124b2e]'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <Settings className="w-4 h-4 text-emerald-700" />
                  <span>Impostazioni Negozio</span>
                </button>
              </div>

              {/* Security Health status widget */}
              <div className="hidden md:block p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 text-[11px] text-emerald-950 mt-4">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Image &amp; API Guard</span>
                </div>
                <p className="text-[10px] text-emerald-800 leading-tight">
                  Magic byte raster verification active. Stripped EXIF. Persistent disk storage.
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
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

                    <div className="flex items-center gap-2">
                      <select
                        value={orderStatusFilter}
                        onChange={e => setOrderStatusFilter(e.target.value)}
                        className="text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                      >
                        <option value="all">All Statuses ({orders.length})</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready for Pickup</option>
                        <option value="collected">Collected</option>
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
                                order.status === 'collected' ? 'bg-slate-100 text-slate-700' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Mark Preparing
                                </button>
                              )}
                              {(order.status === 'pending' || order.status === 'preparing') && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Mark Ready for Pickup
                                </button>
                              )}
                              {order.status === 'ready' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'collected')}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Mark Collected
                                </button>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'collected' && (
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

                    <button
                      onClick={() => {
                        setIsCreatingProduct(true);
                        setEditingProduct(null);
                        setProductSaveError(null);
                        setProductForm({
                          name: '',
                          category: 'Tuberi e Verdure Fresche',
                          origin: 'Importato',
                          price: 5.00,
                          originalPrice: undefined,
                          packageSize: '1 pezzo / conf.',
                          stock: 20,
                          description: '',
                          isAvailable: true,
                          image: 'catTubers',
                          imageStatus: 'needs_review',
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
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        Scorte Basse ({products.filter(p => p.stock <= 5).length})
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
                              imageStatus: 'needs_review'
                            }));
                          }}
                          onRemoveImage={() => {
                            setProductForm(prev => ({
                              ...prev,
                              image: 'catTubers',
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
                          <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                          <select
                            value={productForm.category || 'Tuberi e Verdure Fresche'}
                            onChange={e => setProductForm({ ...productForm, category: e.target.value as any })}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white"
                          >
                            <option value="Tuberi e Verdure Fresche">Tuberi e Verdure Fresche</option>
                            <option value="Cereali e Farine Tradizionali">Cereali e Farine Tradizionali</option>
                            <option value="Pesce Affumicato e Carni">Pesce Affumicato e Carni</option>
                            <option value="Spezie e Olio di Palma">Spezie e Olio di Palma</option>
                            <option value="Bevande al Malto e Ibisco">Bevande al Malto e Ibisco</option>
                            <option value="Snack e Dolci Caraibici">Snack e Dolci Caraibici</option>
                            <option value="Cura Afro e Cosmetici">Cura Afro e Cosmetici</option>
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
                          <label className="block font-bold text-slate-700 mb-1">Price (€) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={productForm.price !== undefined ? productForm.price : ''}
                            onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Stock Level *</label>
                          <input
                            type="number"
                            required
                            value={productForm.stock !== undefined ? productForm.stock : 10}
                            onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
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
                          <label className="block font-bold text-slate-700 mb-1">Availability</label>
                          <select
                            value={productForm.isAvailable !== false ? 'active' : 'inactive'}
                            onChange={e => setProductForm({ ...productForm, isAvailable: e.target.value === 'active' })}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white"
                          >
                            <option value="active">Active (Available for pickup)</option>
                            <option value="inactive">Inactive / Hidden</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Ingredients (Optional)</label>
                          <input
                            type="text"
                            value={productForm.ingredients || ''}
                            onChange={e => setProductForm({ ...productForm, ingredients: e.target.value })}
                            placeholder="e.g. 100% Raw Shea Butter"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Allergen Information (Optional)</label>
                          <input
                            type="text"
                            value={productForm.allergenInfo || ''}
                            onChange={e => setProductForm({ ...productForm, allergenInfo: e.target.value })}
                            placeholder="e.g. May contain traces of peanuts"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg"
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
                                    value={productForm.originalPrice !== undefined ? productForm.originalPrice : ''}
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
                                    value={productForm.price !== undefined ? productForm.price : ''}
                                    onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
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
                            <th className="p-3">Prezzo</th>
                            <th className="p-3">Promozioni &amp; Badge</th>
                            <th className="p-3">Giacenza</th>
                            <th className="p-3">Accuratezza Foto</th>
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
                                  (p.sku && p.sku.toLowerCase().includes(q))
                                );
                                if (!matchesSearch) return false;
                              }
                              if (productPromoFilter === 'offers') {
                                return isProductDiscountActive(p) || p.isDiscounted || (p.originalPrice && p.originalPrice > p.price);
                              }
                              if (productPromoFilter === 'new') {
                                return isProductNewArrival(p);
                              }
                              if (productPromoFilter === 'lowstock') {
                                return p.stock <= 5;
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
                                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                        <img
                                          src={resolveImage(prod.image)}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="truncate">
                                        <span className="block truncate font-bold text-slate-900">{prod.name}</span>
                                        <span className="block text-[11px] text-slate-400 font-normal">
                                          {prod.packageSize} {prod.sku && `· ${prod.sku}`}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600">{prod.category}</td>
                                  <td className="p-3">
                                    <div className="font-extrabold text-slate-900">
                                      €{prod.price.toFixed(2)}
                                    </div>
                                    {hasDiscount && prod.originalPrice && prod.originalPrice > prod.price && (
                                      <div className="text-[11px] text-slate-400 line-through">
                                        €{prod.originalPrice.toFixed(2)}
                                      </div>
                                    )}
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

                                      {(prod.isDiscounted || (prod.originalPrice && prod.originalPrice > prod.price)) ? (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${promoStatus.badgeClass}`}>
                                          <Flame className="w-2.5 h-2.5" />
                                          <span>
                                            {prod.originalPrice && prod.originalPrice > prod.price 
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
                                    <span className={`font-bold ${prod.stock <= 5 ? 'text-rose-600' : 'text-slate-700'}`}>
                                      {prod.stock} unità
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      prod.imageStatus === 'verified'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : prod.imageStatus === 'missing'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {prod.imageStatus === 'verified' ? '✓ Verificata' : prod.imageStatus === 'missing' ? 'Mancante' : 'Da Rivedere'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      prod.isAvailable && prod.stock > 0
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {prod.isAvailable && prod.stock > 0 ? 'Attivo' : 'Non disp.'}
                                    </span>
                                  </td>
                                <td className="p-3 text-right space-x-1">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(prod);
                                      setIsCreatingProduct(false);
                                      setProductSaveError(null);
                                      setProductForm(prod);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-stone-100 cursor-pointer inline-flex items-center gap-1"
                                    title="Edit product and photo"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-semibold">Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-stone-100 cursor-pointer inline-flex items-center gap-1"
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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
                <div className="space-y-4 max-w-xl">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900">Website &amp; Storefront Settings</h3>
                    <p className="text-xs text-slate-500">Update top announcement strip, contact numbers, and store hours</p>
                  </div>

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
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
