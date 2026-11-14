import { useEffect, useState } from 'react';
import { authApi } from './api/authApi';
import { marketplaceApi } from './api/marketplaceApi';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function PaginationBar({
  currentPage,aimport { useEffect, useState } from 'react';
import { authApi } from './api/authApi';
import { marketplaceApi } from './api/marketplaceApi';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function PaginationBar({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 }}>
      <button
        type="button"
        className="btn btn-outline"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Trước
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
          style={
            currentPage === page
              ? { background: '#4f46e5', borderColor: '#4f46e5', color: '#fff' }
              : undefined
          }
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="btn btn-outline"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Sau →
      </button>
    </div>
  );
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('market');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    pass: '',
    accountType: 'CUSTOMER',
    shopName: '',
  });

  // Thông báo nổi
  const [msg, setMsg] = useState('');
  const [isClosingToast, setIsClosingToast] = useState(false);

  // Dữ liệu sàn
  const [products, setProducts] = useState<any[]>([]);
  const [selectedShopView, setSelectedShopView] = useState<{ id: string; name: string } | null>(null);

  // Người mua
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
  const [checkoutForm, setCheckoutForm] = useState({ quantity: 1, buyerPhone: '', shippingAddress: '' });
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [editingBuyerOrder, setEditingBuyerOrder] = useState<any>(null);
  const [buyerEditForm, setBuyerEditForm] = useState({ buyerPhone: '', shippingAddress: '' });

  // Modal Hủy đơn hàng & Xóa sản phẩm
  const [cancellingOrder, setCancellingOrder] = useState<{
    id: string;
    role: 'CUSTOMER' | 'SHOP_OWNER';
    productName?: string;
  } | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [expandedCancelIds, setExpandedCancelIds] = useState<Record<string, boolean>>({});
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(null);

  // Người bán
  const [myShop, setMyShop] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState({ name: '', sku: '', price: '', stock: '10', imageUrl: '' });

  // Admin
  const [adminShops, setAdminShops] = useState<any[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [selectedAdminShopId, setSelectedAdminShopId] = useState<string | null>(null);
  const [selectedAdminCustomer, setSelectedAdminCustomer] = useState<any>(null);

  // Phân trang
  const [publicProdPage, setPublicProdPage] = useState(1);
  const [buyerOrderPage, setBuyerOrderPage] = useState(1);
  const [sellerProdPage, setSellerProdPage] = useState(1);
  const [sellerOrderPage, setSellerOrderPage] = useState(1);
  const [adminShopPage, setAdminShopPage] = useState(1);
  const [adminShopProdPage, setAdminShopProdPage] = useState(1);
  const [adminUserPage, setAdminUserPage] = useState(1);
  const [adminUserOrderPage, setAdminUserOrderPage] = useState(1);

  const showToast = (text: string) => {
    setIsClosingToast(false);
    setMsg(text);
  };

  const toggleCancelReason = (orderId: string) => {
    setExpandedCancelIds((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const renderStatusBadge = (orderId: string, status: string, cancelReason?: string) => {
    if (status === 'DELIVERED') {
      return (
        <span className="badge" style={{ background: '#dcfce7', color: '#15803d', whiteSpace: 'nowrap' }}>
          Giao thành công
        </span>
      );
    }
    if (status === 'HANDED_OVER') {
      return (
        <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', whiteSpace: 'nowrap' }}>
          Đang giao hàng
        </span>
      );
    }
    if (status === 'CANCELLED') {
      const isExpanded = !!expandedCancelIds[orderId];
      return (
        <div>
          <button
            type="button"
            onClick={() => toggleCancelReason(orderId)}
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
            }}
            title="Bấm để xem lý do hủy"
          >
            <span>Đã hủy đơn</span>
            <span>{isExpanded ? '▲' : '▼'}</span>
          </button>

          {isExpanded && (
            <div
              style={{
                fontSize: 12,
                color: '#991b1b',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '6px 8px',
                borderRadius: 6,
                marginTop: 6,
                maxWidth: 220,
              }}
            >
              <b>Lý do hủy:</b> {cancelReason || 'Không có ghi chú'}
            </div>
          )}
        </div>
      );
    }
    return (
      <span className="badge" style={{ background: '#fef3c7', color: '#b45309', whiteSpace: 'nowrap' }}>
        Đang xử lý
      </span>
    );
  };

  // --- HELPER LƯU & ĐỌC SĐT / ĐỊA CHỈ CŨ ---
  const getSavedShippingKey = (u: any) => `saved_shipping_${u?.userId || u?.id || u?.email}`;

  const saveBuyerShippingProfile = (phone: string, address: string) => {
    if (!user) return;
    localStorage.setItem(
      getSavedShippingKey(user),
      JSON.stringify({ buyerPhone: phone.trim(), shippingAddress: address.trim() }),
    );
  };

  const loadBuyerShippingProfile = (ordersList: any[]) => {
    if (!user) return { buyerPhone: '', shippingAddress: '' };
    const savedRaw = localStorage.getItem(getSavedShippingKey(user));
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (parsed.buyerPhone || parsed.shippingAddress) return parsed;
      } catch {}
    }
    if (ordersList.length > 0 && ordersList[0].buyerPhone) {
      return {
        buyerPhone: ordersList[0].buyerPhone,
        shippingAddress: ordersList[0].shippingAddress || '',
      };
    }
    return { buyerPhone: '', shippingAddress: '' };
  };

  const loadPublicProducts = async () => {
    try {
      const res = await marketplaceApi.getAllProducts();
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUserContext = async (isInitialLogin = false) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const profileRes = await authApi.getProfile();
      const currentUser = profileRes.data;
      setUser(currentUser);

      if (currentUser.role === 'CUSTOMER') {
        if (isInitialLogin) setActiveTab('market');
        const myOrdersRes = await marketplaceApi.getMyOrders();
        setMyOrders(Array.isArray(myOrdersRes.data) ? myOrdersRes.data : []);
      } else if (currentUser.role === 'SHOP_OWNER') {
        if (isInitialLogin) setActiveTab('shop-products');
        const [shopRes, myProdRes, orderRes] = await Promise.all([
          marketplaceApi.getMyShop(),
          marketplaceApi.getMyProducts(),
          marketplaceApi.getMyShopOrders(),
        ]);
        setMyShop(shopRes.data);
        setMyProducts(Array.isArray(myProdRes.data) ? myProdRes.data : []);
        setShopOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
      } else if (currentUser.role === 'SUPER_ADMIN') {
        if (isInitialLogin) setActiveTab('admin-shops');
        const [shopsRes, ordersRes, customersRes] = await Promise.all([
          marketplaceApi.getAllShopsAdmin(),
          marketplaceApi.getAllOrdersAdmin(),
          marketplaceApi.getAllCustomersAdmin(),
        ]);
        setAdminShops(Array.isArray(shopsRes.data) ? shopsRes.data : []);
        setAdminOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setAdminCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      }
    } catch {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  useEffect(() => {
    loadPublicProducts();
    loadUserContext(true);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const fadeTimer = setTimeout(() => setIsClosingToast(true), 1700);
    const clearTimer = setTimeout(() => {
      setMsg('');
      setIsClosingToast(false);
    }, 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [msg]);

  // --- AUTH ---
  const handleAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!EMAIL_REGEX.test(authForm.email.trim())) {
      return showToast('Vui lòng nhập đúng định dạng Email!');
    }
    try {
      if (authMode === 'register') {
        await authApi.register(authForm);
        showToast('Đăng ký thành công! Hãy bấm Đăng nhập.');
        setAuthMode('login');
      } else {
        const res = await authApi.login({ email: authForm.email, pass: authForm.pass });
        localStorage.setItem('access_token', res.data.access_token);
        showToast('Đăng nhập thành công!');
        await loadUserContext(true);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Sai thông tin đăng nhập');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setMyShop(null);
    setMyProducts([]);
    setShopOrders([]);
    setMyOrders([]);
    setAdminShops([]);
    setAdminCustomers([]);
    setAdminOrders([]);
    setSelectedAdminShopId(null);
    setSelectedAdminCustomer(null);
    setSelectedShopView(null);
    setActiveTab('market');
    showToast('Đã đăng xuất.');
  };

  // --- SHOP OWNER ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return showToast('Chọn ảnh nhỏ hơn 4MB!');
    const reader = new FileReader();
    reader.onloadend = () => setProdForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myShop && !myShop.isActive) return showToast('Cửa hàng đã bị khóa! Vui lòng liên hệ Admin.');
    try {
      const payload = {
        name: prodForm.name,
        sku: prodForm.sku,
        price: Number(prodForm.price),
        stock: Number(prodForm.stock),
        imageUrl: prodForm.imageUrl || undefined,
      };
      if (editingProductId) {
        await marketplaceApi.updateProduct(editingProductId, payload);
        showToast('Cập nhật sản phẩm thành công!');
      } else {
        await marketplaceApi.createProduct(payload);
        showToast('Đăng bán sản phẩm mới thành công!');
      }
      setEditingProductId(null);
      setProdForm({ name: '', sku: '', price: '', stock: '10', imageUrl: '' });
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi lưu sản phẩm');
    }
  };

  const startEditProduct = (p: any) => {
    setEditingProductId(p.id);
    setProdForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      stock: String(p.stock),
      imageUrl: p.imageUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await marketplaceApi.deleteProduct(deletingProduct.id);
      showToast(`Đã xóa sản phẩm "${deletingProduct.name}"!`);
      setDeletingProduct(null);
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi xóa sản phẩm');
    }
  };

  const handleShopOrderStatus = async (
    orderId: string,
    status: 'PREPARING' | 'HANDED_OVER' | 'DELIVERED' | 'CANCELLED',
    reason?: string,
  ) => {
    try {
      await marketplaceApi.updateShopOrderStatus(orderId, { status, cancelReason: reason });
      showToast('Đã cập nhật trạng thái đơn hàng!');
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  // --- CUSTOMER ---
  const openCheckoutModal = (product: any) => {
    if (!user) {
      showToast('Vui lòng đăng nhập tài khoản Người mua để đặt hàng!');
      setActiveTab('auth');
      return;
    }
    if (user.role !== 'CUSTOMER') return showToast('Chỉ tài khoản Người mua mới được đặt hàng!');

    const savedInfo = loadBuyerShippingProfile(myOrders);
    setCheckoutProduct(product);
    setCheckoutForm({
      quantity: 1,
      buyerPhone: savedInfo.buyerPhone,
      shippingAddress: savedInfo.shippingAddress,
    });
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutProduct) return;
    try {
      await marketplaceApi.createOrder({
        productId: checkoutProduct.id,
        quantity: Number(checkoutForm.quantity),
        buyerPhone: checkoutForm.buyerPhone,
        shippingAddress: checkoutForm.shippingAddress,
      });
      saveBuyerShippingProfile(checkoutForm.buyerPhone, checkoutForm.shippingAddress);
      showToast(`Đặt mua thành công "${checkoutProduct.name}"!`);
      setCheckoutProduct(null);
      await loadPublicProducts();
      await loadUserContext(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi đặt hàng');
    }
  };

  const handleSaveBuyerAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuyerOrder) return;
    try {
      await marketplaceApi.updateOrderBuyerInfo(editingBuyerOrder.id, buyerEditForm);
      saveBuyerShippingProfile(buyerEditForm.buyerPhone, buyerEditForm.shippingAddress);
      showToast('Đã cập nhật SĐT và Địa chỉ nhận hàng!');
      setEditingBuyerOrder(null);
      await loadUserContext(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật địa chỉ');
    }
  };

  const handleConfirmCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    const finalReason = cancelReasonText.trim() || 'Hủy đơn hàng';

    try {
      if (cancellingOrder.role === 'CUSTOMER') {
        await marketplaceApi.cancelOrderByBuyer(cancellingOrder.id, finalReason);
      } else {
        await marketplaceApi.updateShopOrderStatus(cancellingOrder.id, {
          status: 'CANCELLED',
          cancelReason: finalReason,
        });
      }
      showToast('Đã hủy đơn hàng thành công!');
      setCancellingOrder(null);
      setCancelReasonText('');
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể hủy đơn hàng');
    }
  };

  // --- ADMIN ---
  const handleToggleShop = async (shopId: string, currentStatus: boolean) => {
    try {
      await marketplaceApi.toggleShopStatus(shopId, !currentStatus);
      showToast(!currentStatus ? 'Đã mở khóa Gian hàng!' : 'Đã khóa Gian hàng!');
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi đổi trạng thái shop');
    }
  };

  const displayedProducts = selectedShopView
    ? products.filter((p) => p.shop?.id === selectedShopView.id)
    : products;

  const selectedAdminShop = selectedAdminShopId
    ? adminShops.find((s) => s.id === selectedAdminShopId) || null
    : null;

  const selectedCustomerOrders = selectedAdminCustomer
    ? adminOrders.filter(
        (o) => o.buyerId === selectedAdminCustomer.id || o.buyerName === selectedAdminCustomer.email,
      )
    : [];

  const shopDeliveredCount = shopOrders.filter((o) => o.status === 'DELIVERED').length;
  const shopCancelledCount = shopOrders.filter((o) => o.status === 'CANCELLED').length;

  return (
    <div className="admin-shell" style={{ background: '#f1f5f9' }}>
      {/* SIDEBAR BÊN TRÁI */}
      <aside
        className="sidebar"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#e2e8f0',
          borderRight: '1px solid #1e293b',
        }}
      >
        <div
          className="sidebar-header"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
          onClick={() => {
            setSelectedShopView(null);
            setPublicProdPage(1);
            if (!user) setActiveTab('market');
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            ⚡
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 0.3, color: '#ffffff' }}>TechNova</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Sàn Công Nghệ & Phụ Kiện</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {!user && (
            <>
              <button
                className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
                style={activeTab === 'market' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('market')}
              >
                🛍️ Khám phá sản phẩm ({products.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'auth' ? 'active' : ''}`}
                style={activeTab === 'auth' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('auth')}
              >
                🔑 Đăng nhập / Đăng ký
              </button>
            </>
          )}

          {user?.role === 'CUSTOMER' && (
            <>
              <button
                className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
                style={activeTab === 'market' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('market')}
              >
                🛍️ Mua sắm công nghệ ({products.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'my-orders' ? 'active' : ''}`}
                style={activeTab === 'my-orders' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('my-orders')}
              >
                📦 Đơn hàng của tôi ({myOrders.length})
              </button>
            </>
          )}

          {user?.role === 'SHOP_OWNER' && (
            <>
              <button
                className={`nav-item ${activeTab === 'shop-products' ? 'active' : ''}`}
                style={activeTab === 'shop-products' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('shop-products')}
              >
                💻 Kho hàng của Shop ({myProducts.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'shop-orders' ? 'active' : ''}`}
                style={activeTab === 'shop-orders' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('shop-orders')}
              >
                🚚 Quản lý đơn đặt ({shopOrders.length})
              </button>
            </>
          )}

          {user?.role === 'SUPER_ADMIN' && (
            <>
              <button
                className={`nav-item ${activeTab === 'admin-shops' ? 'active' : ''}`}
                style={activeTab === 'admin-shops' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('admin-shops')}
              >
                🏢 Quản lý Gian hàng ({adminShops.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'admin-users' ? 'active' : ''}`}
                style={activeTab === 'admin-users' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('admin-users')}
              >
                👥 Quản lý Khách hàng ({adminCustomers.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
                style={activeTab === 'market' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('market')}
              >
                🛍️ Xem giao diện Sàn ({products.length})
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          <div>TechNova Marketplace</div>
          <div>Chính hãng • Giao hỏa tốc</div>
        </div>
      </aside>

      {/* KHUNG LÀM VIỆC CHÍNH BÊN PHẢI */}
      <div className="main-wrapper">
        <header className="topbar" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>
              {user?.role === 'SUPER_ADMIN'
                ? 'Trung tâm Điều hành Sàn TechNova'
                : user?.role === 'SHOP_OWNER'
                ? `Kênh Đối Tác Bán Hàng — ${myShop?.name || 'Gian hàng'}`
                : user?.role === 'CUSTOMER'
                ? 'Thế Giới Công Nghệ Chính Hãng'
                : activeTab === 'auth'
                ? 'Xác thực tài khoản'
                : 'Sàn Thương Mại Điện Tử Công Nghệ TechNova'}
            </span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>{user.email}</span>
              <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontWeight: 700 }}>
                {user.role}
              </span>
              <button className="btn btn-danger" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {activeTab === 'auth' ? (
                <button className="btn btn-outline" onClick={() => setActiveTab('market')}>
                  ← Quay lại Sàn sản phẩm
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  onClick={() => setActiveTab('auth')}
                >
                  Đăng nhập / Đăng ký
                </button>
              )}
            </div>
          )}
        </header>

        <main className="content-area">
          {/* BANNER GIỚI THIỆU SÀN CÔNG NGHỆ */}
          {activeTab === 'market' && !selectedShopView && (
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #312e81 55%, #0284c7 100%)',
                color: '#fff',
                borderRadius: 14,
                padding: '22px 26px',
                marginBottom: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)',
              }}
            >
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: '#38bdf8', fontWeight: 700 }}>
                  Flash Sale Công Nghệ • Bảo Hành Chính Hãng
                </div>
                <h2 style={{ margin: '6px 0', fontSize: 21, fontWeight: 800 }}>
                  Nâng Cấp Trải Nghiệm Số — Giá Tốt Từ Nhà Phân Phối
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1' }}>
                  Laptop, bàn phím cơ, tai nghe, phụ kiện và thiết bị thông minh giao nhanh tận nơi.
                </p>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                Sản phẩm sẵn kho: <b>{products.length}</b> thiết bị
              </div>
            </div>
          )}

          {/* THỐNG KÊ NHANH ADMIN */}
          {user?.role === 'SUPER_ADMIN' && (
            <div className="stats-grid">
              <div className="stat-card" style={{ borderTop: '3px solid #4f46e5' }}>
                <div className="stat-label">Tổng số Gian hàng</div>
                <div className="stat-value">{adminShops.length}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #0284c7' }}>
                <div className="stat-label">Tổng số Người mua</div>
                <div className="stat-value">{adminCustomers.length}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #16a34a' }}>
                <div className="stat-label">Sản phẩm đang bán</div>
                <div className="stat-value">{products.length}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
                <div className="stat-label">Tổng đơn toàn sàn</div>
                <div className="stat-value">{adminOrders.length}</div>
              </div>
            </div>
          )}

          {/* THỐNG KÊ NHANH NGƯỜI BÁN */}
          {user?.role === 'SHOP_OWNER' && myShop && (
            <div className="stats-grid">
              <div className="stat-card" style={{ borderTop: '3px solid #4f46e5' }}>
                <div className="stat-label">Trạng thái Gian hàng</div>
                <div className="stat-value" style={{ fontSize: 18, color: myShop.isActive ? '#16a34a' : '#dc2626' }}>
                  {myShop.isActive ? 'Đang hoạt động' : 'Bị khóa'}
                </div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #0284c7' }}>
                <div className="stat-label">Sản phẩm của Shop</div>
                <div className="stat-value">{myProducts.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Tổng đơn hàng</div>
                <div className="stat-value">{shopOrders.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Đơn giao thành công</div>
                <div className="stat-value" style={{ color: '#16a34a' }}>{shopDeliveredCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Đơn đã hủy</div>
                <div className="stat-value" style={{ color: '#dc2626' }}>{shopCancelledCount}</div>
              </div>
            </div>
          )}

          {/* 1. TAB ĐĂNG NHẬP / ĐĂNG KÝ */}
          {!user && activeTab === 'auth' && (
            <div className="panel" style={{ maxWidth: 640, margin: '12px auto', borderTop: '4px solid #4f46e5' }}>
              <div className="panel-header">
                <span className="panel-title">
                  {authMode === 'login' ? 'Đăng nhập hệ thống TechNova' : 'Đăng ký tài khoản mới'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {authMode === 'login' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                        onClick={() => handleAuthSubmit()}
                      >
                        Đăng nhập
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setAuthMode('register')}>
                        Chuyển sang Đăng ký
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                        onClick={() => handleAuthSubmit()}
                      >
                        Hoàn tất Đăng ký
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setAuthMode('login')}>
                        Quay lại Đăng nhập
                      </button>
                    </>
                  )}
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {authMode === 'register' && (
                  <>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <label
                        style={{
                          flex: 1,
                          padding: 10,
                          border: authForm.accountType === 'CUSTOMER' ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                          background: authForm.accountType === 'CUSTOMER' ? '#eef2ff' : '#fff',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="radio"
                          name="accountType"
                          value="CUSTOMER"
                          checked={authForm.accountType === 'CUSTOMER'}
                          onChange={(e) => setAuthForm({ ...authForm, accountType: e.target.value })}
                        />{' '}
                        Người mua hàng
                      </label>
                      <label
                        style={{
                          flex: 1,
                          padding: 10,
                          border: authForm.accountType === 'SHOP_OWNER' ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                          background: authForm.accountType === 'SHOP_OWNER' ? '#eef2ff' : '#fff',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="radio"
                          name="accountType"
                          value="SHOP_OWNER"
                          checked={authForm.accountType === 'SHOP_OWNER'}
                          onChange={(e) => setAuthForm({ ...authForm, accountType: e.target.value })}
                        />{' '}
                        Người bán (Mở Shop)
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        className="input"
                        style={{ flex: 1 }}
                        placeholder="Họ và tên"
                        required
                        value={authForm.name}
                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      />
                      {authForm.accountType === 'SHOP_OWNER' && (
                        <input
                          className="input"
                          style={{ flex: 1 }}
                          placeholder="Tên Gian hàng / Cửa hàng"
                          required
                          value={authForm.shopName}
                          onChange={(e) => setAuthForm({ ...authForm, shopName: e.target.value })}
                        />
                      )}
                    </div>
                  </>
                )}

                <input
                  className="input"
                  type="email"
                  placeholder="Email (VD: tenban@gmail.com)"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                />

                <input
                  className="input"
                  type="password"
                  placeholder="Mật khẩu"
                  required
                  value={authForm.pass}
                  onChange={(e) => setAuthForm({ ...authForm, pass: e.target.value })}
                />
                <button type="submit" style={{ display: 'none' }} />
              </form>
            </div>
          )}

          {/* 2. ADMIN TAB 1: QUẢN LÝ NGƯỜI BÁN */}
          {user?.role === 'SUPER_ADMIN' && activeTab === 'admin-shops' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Danh sách Người bán & Gian hàng ({adminShops.length} Shop)</span>
              </div>

              {adminShops.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14 }}>Chưa có cửa hàng nào trên sàn.</p>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tên Gian hàng</th>
                        <th>Chủ sở hữu</th>
                        <th>Số sản phẩm</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(adminShops, adminShopPage, 5).map((shop) => {
                        const isSelected = selectedAdminShopId === shop.id;
                        return (
                          <tr key={shop.id} style={{ background: isSelected ? '#eef2ff' : 'transparent' }}>
                            <td><b>{shop.name}</b></td>
                            <td>
                              {shop.owner?.name}<br />
                              <small style={{ color: '#64748b' }}>{shop.owner?.email}</small>
                            </td>
                            <td>
                              <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                {shop.products?.length || 0} sản phẩm
                              </span>
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{
                                  background: shop.isActive ? '#dcfce7' : '#fee2e2',
                                  color: shop.isActive ? '#15803d' : '#b91c1c',
                                }}
                              >
                                {shop.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                                  style={isSelected ? { background: '#4f46e5', borderColor: '#4f46e5' } : undefined}
                                  onClick={() => {
                                    setSelectedAdminShopId(isSelected ? null : shop.id);
                                    setAdminShopProdPage(1);
                                  }}
                                >
                                  {isSelected ? 'Đóng chi tiết ▲' : 'Xem chi tiết ▼'}
                                </button>
                                <button
                                  className={`btn ${shop.isActive ? 'btn-danger' : 'btn-success'}`}
                                  onClick={() => handleToggleShop(shop.id, shop.isActive)}
                                >
                                  {shop.isActive ? 'Khóa Shop' : 'Mở khóa'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <PaginationBar
                    currentPage={adminShopPage}
                    totalItems={adminShops.length}
                    pageSize={5}
                    onPageChange={setAdminShopPage}
                  />
                </>
              )}

              {selectedAdminShop && (
                <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <strong>
                      Chi tiết sản phẩm của Shop: {selectedAdminShop.name} ({selectedAdminShop.products?.length || 0} món)
                    </strong>
                    <button className="btn btn-outline" onClick={() => setSelectedAdminShopId(null)}>✕</button>
                  </div>

                  {!selectedAdminShop.products || selectedAdminShop.products.length === 0 ? (
                    <p style={{ fontSize: 14, color: '#64748b' }}>Cửa hàng này chưa đăng sản phẩm nào.</p>
                  ) : (
                    <>
                      <table className="data-table" style={{ background: '#fff' }}>
                        <thead>
                          <tr>
                            <th>Ảnh</th>
                            <th>Tên sản phẩm</th>
                            <th>Mã SKU</th>
                            <th>Giá bán</th>
                            <th>Tồn kho</th>
                            <th>Thao tác Admin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(selectedAdminShop.products, adminShopProdPage, 5).map((prod: any) => (
                            <tr key={prod.id}>
                              <td>
                                {prod.imageUrl ? (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }}
                                  />
                                ) : (
                                  <span style={{ fontSize: 22 }}>💻</span>
                                )}
                              </td>
                              <td><b>{prod.name}</b></td>
                              <td>{prod.sku}</td>
                              <td style={{ color: '#4f46e5', fontWeight: 700 }}>{prod.price.toLocaleString('vi-VN')} ₫</td>
                              <td>{prod.stock}</td>
                              <td>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => setDeletingProduct({ id: prod.id, name: prod.name })}
                                >
                                  Xóa sản phẩm
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <PaginationBar
                        currentPage={adminShopProdPage}
                        totalItems={selectedAdminShop.products.length}
                        pageSize={5}
                        onPageChange={setAdminShopProdPage}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. ADMIN TAB 2: QUẢN LÝ NGƯỜI MUA */}
          {user?.role === 'SUPER_ADMIN' && activeTab === 'admin-users' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Danh sách Người mua ({adminCustomers.length} tài khoản)</span>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Ngày đăng ký</th>
                    <th>Số đơn đã đặt</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(adminCustomers, adminUserPage, 5).map((cust) => {
                    const count = adminOrders.filter(
                      (o) => o.buyerId === cust.id || o.buyerName === cust.email,
                    ).length;
                    const isSelected = selectedAdminCustomer?.id === cust.id;
                    return (
                      <tr key={cust.id} style={{ background: isSelected ? '#eef2ff' : 'transparent' }}>
                        <td><b>{cust.name}</b></td>
                        <td>{cust.email}</td>
                        <td>{new Date(cust.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                            {count} đơn
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                            style={isSelected ? { background: '#4f46e5', borderColor: '#4f46e5' } : undefined}
                            onClick={() => {
                              setSelectedAdminCustomer(isSelected ? null : cust);
                              setAdminUserOrderPage(1);
                            }}
                          >
                            {isSelected ? 'Đóng chi tiết ▲' : 'Xem chi tiết ▼'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <PaginationBar
                currentPage={adminUserPage}
                totalItems={adminCustomers.length}
                pageSize={5}
                onPageChange={setAdminUserPage}
              />

              {selectedAdminCustomer && (
                <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <strong>Chi tiết đơn hàng của: {selectedAdminCustomer.name} ({selectedAdminCustomer.email})</strong>
                    <button className="btn btn-outline" onClick={() => setSelectedAdminCustomer(null)}>✕</button>
                  </div>

                  {selectedCustomerOrders.length === 0 ? (
                    <p style={{ fontSize: 14, color: '#64748b' }}>Người dùng này chưa đặt đơn hàng nào.</p>
                  ) : (
                    <>
                      <table className="data-table" style={{ background: '#fff' }}>
                        <thead>
                          <tr>
                            <th>Mã đơn</th>
                            <th>Sản phẩm & Shop</th>
                            <th>SĐT & Địa chỉ nhận</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(selectedCustomerOrders, adminUserOrderPage, 5).map((o) => (
                            <tr key={o.id}>
                              <td>#{o.id.slice(0, 8).toUpperCase()}</td>
                              <td><b>{o.productName}</b> (x{o.quantity}) — Shop: {o.shop?.name}</td>
                              <td>{o.buyerPhone} — {o.shippingAddress}</td>
                              <td style={{ fontWeight: 700, color: '#4f46e5' }}>{o.totalAmount.toLocaleString('vi-VN')} ₫</td>
                              <td>{renderStatusBadge(o.id, o.status, o.cancelReason)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <PaginationBar
                        currentPage={adminUserOrderPage}
                        totalItems={selectedCustomerOrders.length}
                        pageSize={5}
                        onPageChange={setAdminUserOrderPage}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. SHOP OWNER TAB 1: QUẢN LÝ SẢN PHẨM CỦA RIÊNG SHOP */}
          {user?.role === 'SHOP_OWNER' && myShop && activeTab === 'shop-products' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Sản phẩm của Cửa hàng ({myProducts.length})</span>
              </div>

              {!myShop.isActive ? (
                <div style={{ padding: 14, background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 20, fontWeight: 600 }}>
                  ⚠️ Shop của bạn đã bị khóa! Bạn không thể đăng hoặc sửa sản phẩm. Vui lòng liên hệ Admin.
                </div>
              ) : (
                <form
                  onSubmit={handleSaveProduct}
                  style={{
                    background: '#eef2ff',
                    padding: 16,
                    borderRadius: 10,
                    marginBottom: 20,
                    border: '1px solid #c7d2fe',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10, color: '#1e1b4b' }}>
                    {editingProductId ? '✏️ Chỉnh sửa sản phẩm' : '⚡ Đăng bán sản phẩm mới'}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <input className="input" style={{ flex: 1 }} placeholder="Tên sản phẩm" required value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} />
                    <input className="input" style={{ flex: 1 }} placeholder="Mã SKU" required value={prodForm.sku} onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })} />
                    <input className="input" style={{ flex: 1 }} type="number" placeholder="Giá bán" required value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} />
                    <input className="input" style={{ flex: 1 }} type="number" placeholder="Tồn kho" required value={prodForm.stock} onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    {prodForm.imageUrl && (
                      <img src={prodForm.imageUrl} alt="preview" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      {editingProductId && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => {
                            setEditingProductId(null);
                            setProdForm({ name: '', sku: '', price: '', stock: '10', imageUrl: '' });
                          }}
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                      >
                        {editingProductId ? 'Lưu cập nhật' : 'Đăng sản phẩm'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="product-grid">
                {paginate(myProducts, sellerProdPage, 4).map((p) => (
                  <div key={p.id} className="product-card" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: 160, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                        💻
                      </div>
                    )}
                    <div className="product-body">
                      <div style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>{myShop.name}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, margin: '4px 0', color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontWeight: 800, color: '#4f46e5', fontSize: 16 }}>{p.price.toLocaleString('vi-VN')} ₫</div>
                      <div style={{ fontSize: 12, color: '#64748b', margin: '6px 0 12px' }}>SKU: {p.sku} | Kho: {p.stock}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        <button className="btn btn-outline" style={{ flex: 1 }} disabled={!myShop.isActive} onClick={() => startEditProduct(p)}>Sửa</button>
                        <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setDeletingProduct({ id: p.id, name: p.name })}>Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <PaginationBar currentPage={sellerProdPage} totalItems={myProducts.length} pageSize={4} onPageChange={setSellerProdPage} />
            </div>
          )}

          {/* 5. SHOP OWNER TAB 2: QUẢN LÝ ĐƠN HÀNG */}
          {user?.role === 'SHOP_OWNER' && myShop && activeTab === 'shop-orders' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Quản lý Đơn hàng của Shop ({shopOrders.length} tổng đơn)</span>
              </div>

              {shopOrders.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14 }}>Chưa có đơn hàng nào.</p>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Sản phẩm</th>
                        <th>Khách nhận & SĐT</th>
                        <th>Địa chỉ</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Xử lý vận chuyển</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(shopOrders, sellerOrderPage, 5).map((o) => (
                        <tr key={o.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td><b>{o.productName}</b> (x{o.quantity})</td>
                          <td>{o.buyerName}<br /><small>{o.buyerPhone}</small></td>
                          <td>{o.shippingAddress}</td>
                          <td style={{ fontWeight: 700, whiteSpace: 'nowrap', color: '#4f46e5' }}>{o.totalAmount.toLocaleString('vi-VN')} ₫</td>
                          <td>{renderStatusBadge(o.id, o.status, o.cancelReason)}</td>
                          <td>
                            {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' ? (
                              <select
                                className="input"
                                style={{
                                  padding: '6px 10px',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  minWidth: 190,
                                  borderColor: '#cbd5e1',
                                }}
                                value={o.status}
                                onChange={(e) => {
                                  const nextStatus = e.target.value as
                                    | 'PREPARING'
                                    | 'HANDED_OVER'
                                    | 'DELIVERED'
                                    | 'CANCELLED';
                                  if (nextStatus === 'CANCELLED') {
                                    setCancellingOrder({
                                      id: o.id,
                                      role: 'SHOP_OWNER',
                                      productName: o.productName,
                                    });
                                    setCancelReasonText('Hết hàng (Báo hủy cho ĐVVC)');
                                  } else {
                                    handleShopOrderStatus(o.id, nextStatus);
                                  }
                                }}
                              >
                                <option value="PREPARING">Đang xử lý</option>
                                <option value="HANDED_OVER">Đang giao hàng</option>
                                <option value="DELIVERED">Giao thành công</option>
                                <option value="CANCELLED">Hủy đơn (Nhập lý do)...</option>
                              </select>
                            ) : (
                              <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>Đã hoàn tất</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginationBar currentPage={sellerOrderPage} totalItems={shopOrders.length} pageSize={5} onPageChange={setSellerOrderPage} />
                </>
              )}
            </div>
          )}

          {/* 6. CUSTOMER TAB: ĐƠN HÀNG CỦA TÔI */}
          {user?.role === 'CUSTOMER' && activeTab === 'my-orders' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Đơn hàng đã mua ({myOrders.length})</span>
              </div>

              {myOrders.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14 }}>Bạn chưa đặt mua đơn hàng nào.</p>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Sản phẩm & Shop</th>
                        <th>SĐT & Địa chỉ nhận</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(myOrders, buyerOrderPage, 5).map((o) => (
                        <tr key={o.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td><b>{o.productName}</b> (x{o.quantity})<br /><small>Shop: {o.shop?.name}</small></td>
                          <td>{o.buyerPhone}<br /><small>{o.shippingAddress}</small></td>
                          <td style={{ fontWeight: 700, color: '#4f46e5', whiteSpace: 'nowrap' }}>{o.totalAmount.toLocaleString('vi-VN')} ₫</td>
                          <td>{renderStatusBadge(o.id, o.status, o.cancelReason)}</td>
                          <td>
                            {o.status === 'PREPARING' ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="btn btn-outline"
                                  onClick={() => {
                                    setEditingBuyerOrder(o);
                                    setBuyerEditForm({ buyerPhone: o.buyerPhone || '', shippingAddress: o.shippingAddress || '' });
                                  }}
                                >
                                  Đổi SĐT / ĐC
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => {
                                    setCancellingOrder({ id: o.id, role: 'CUSTOMER', productName: o.productName });
                                    setCancelReasonText('Thay đổi ý định mua hàng');
                                  }}
                                >
                                  Hủy đơn
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>Khóa chỉnh sửa</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginationBar currentPage={buyerOrderPage} totalItems={myOrders.length} pageSize={5} onPageChange={setBuyerOrderPage} />
                </>
              )}
            </div>
          )}

          {/* 7. TAB SÀN SẢN PHẨM */}
          {user?.role !== 'SHOP_OWNER' && activeTab === 'market' && (
            <div className="panel" style={{ borderRadius: 14 }}>
              <div className="panel-header">
                <span className="panel-title" style={{ color: '#0f172a' }}>
                  {selectedShopView
                    ? `Gian hàng: ${selectedShopView.name} (${displayedProducts.length} sản phẩm)`
                    : `Sản phẩm công nghệ nổi bật (${displayedProducts.length})`}
                </span>
                {selectedShopView && (
                  <button className="btn btn-outline" onClick={() => setSelectedShopView(null)}>
                    ← Xem tất cả sản phẩm
                  </button>
                )}
              </div>

              <div className="product-grid">
                {paginate(displayedProducts, publicProdPage, 8).map((p) => (
                  <div
                    key={p.id}
                    className="product-card"
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
                    }}
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: 165, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: 165, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>
                        💻
                      </div>
                    )}
                    <div className="product-body">
                      <div
                        style={{
                          fontSize: 12,
                          color: '#4f46e5',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onClick={() => {
                          if (p.shop?.id) {
                            setSelectedShopView({ id: p.shop.id, name: p.shop.name });
                            setPublicProdPage(1);
                          }
                        }}
                      >
                        <span>🏢 {p.shop?.name}</span>
                        <span style={{ fontWeight: 400, color: '#64748b' }}>(Xem Shop)</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, margin: '6px 0', color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontWeight: 800, color: '#dc2626', fontSize: 17 }}>{p.price.toLocaleString('vi-VN')} ₫</div>
                      <div style={{ fontSize: 12, color: '#64748b', margin: '6px 0 12px' }}>Còn lại: {p.stock} sản phẩm</div>

                      {(!user || user.role === 'CUSTOMER') && (
                        <button
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            marginTop: 'auto',
                            background: p.shop?.isActive === false || p.stock <= 0 ? '#94a3b8' : '#4f46e5',
                            borderColor: p.shop?.isActive === false || p.stock <= 0 ? '#94a3b8' : '#4f46e5',
                            fontWeight: 600,
                          }}
                          disabled={p.stock <= 0 || p.shop?.isActive === false}
                          onClick={() => openCheckoutModal(p)}
                        >
                          {p.shop?.isActive === false ? 'Shop tạm khóa' : p.stock > 0 ? 'Mua ngay' : 'Hết hàng'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <PaginationBar currentPage={publicProdPage} totalItems={displayedProducts.length} pageSize={8} onPageChange={setPublicProdPage} />
            </div>
          )}
        </main>
      </div>

      {/* MODAL XÁC NHẬN XÓA SẢN PHẨM Ở GIỮA MÀN HÌNH */}
      {deletingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="panel" style={{ width: 420, maxWidth: '100%', margin: 0, textAlign: 'center', padding: 24, borderRadius: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>Xác nhận xóa sản phẩm</h3>
            <p style={{ fontSize: 14, color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa sản phẩm <b>"{deletingProduct.name}"</b> không?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setDeletingProduct(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={confirmDeleteProduct}
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐẶT HÀNG */}
      {checkoutProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="panel" style={{ width: 440, margin: 0, borderRadius: 14 }}>
            <div className="panel-header">
              <span className="panel-title" style={{ color: '#1e1b4b' }}>Thông tin nhận hàng</span>
              <button className="btn btn-outline" onClick={() => setCheckoutProduct(null)}>✕</button>
            </div>
            <p style={{ fontSize: 14, marginBottom: 12 }}>
              Món hàng: <b>{checkoutProduct.name}</b> — Shop: <b>{checkoutProduct.shop?.name}</b>
              <br />
              <span style={{ color: '#dc2626', fontWeight: 700 }}>
                Tổng thanh toán:{' '}
                {(checkoutProduct.price * (Number(checkoutForm.quantity) || 1)).toLocaleString('vi-VN')} ₫
              </span>
            </p>
            <form onSubmit={handleConfirmPurchase} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" type="number" min={1} max={checkoutProduct.stock} required placeholder="Số lượng" value={checkoutForm.quantity} onChange={(e) => setCheckoutForm({ ...checkoutForm, quantity: Number(e.target.value) })} />
              <input className="input" required placeholder="Số điện thoại người nhận (10 số)" value={checkoutForm.buyerPhone} onChange={(e) => setCheckoutForm({ ...checkoutForm, buyerPhone: e.target.value })} />
              <input className="input" required placeholder="Địa chỉ giao hàng chi tiết" value={checkoutForm.shippingAddress} onChange={(e) => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                {(checkoutForm.buyerPhone || checkoutForm.shippingAddress) ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: 12, padding: '6px 10px' }}
                    onClick={() => {
                      if (user) localStorage.removeItem(getSavedShippingKey(user));
                      setCheckoutForm({ ...checkoutForm, buyerPhone: '', shippingAddress: '' });
                    }}
                  >
                    Nhập địa chỉ mới
                  </button>
                ) : <span />}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setCheckoutProduct(null)}>Hủy</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  >
                    Xác nhận đặt mua
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI SĐT / ĐỊA CHỈ */}
      {editingBuyerOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="panel" style={{ width: 420, margin: 0, borderRadius: 14 }}>
            <div className="panel-header">
              <span className="panel-title">Đổi SĐT & Địa chỉ nhận</span>
              <button className="btn btn-outline" onClick={() => setEditingBuyerOrder(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveBuyerAddress} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" required placeholder="Số điện thoại mới" value={buyerEditForm.buyerPhone} onChange={(e) => setBuyerEditForm({ ...buyerEditForm, buyerPhone: e.target.value })} />
              <input className="input" required placeholder="Địa chỉ mới" value={buyerEditForm.shippingAddress} onChange={(e) => setBuyerEditForm({ ...buyerEditForm, shippingAddress: e.target.value })} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingBuyerOrder(null)}>Đóng</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LÝ DO HỦY ĐƠN HÀNG */}
      {cancellingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="panel" style={{ width: 440, margin: 0, borderRadius: 14 }}>
            <div className="panel-header">
              <span className="panel-title" style={{ color: '#dc2626' }}>Xác nhận Hủy đơn hàng</span>
              <button className="btn btn-outline" onClick={() => setCancellingOrder(null)}>✕</button>
            </div>
            {cancellingOrder.productName && (
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
                Sản phẩm: <b>{cancellingOrder.productName}</b>
              </p>
            )}

            <form onSubmit={handleConfirmCancelOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(cancellingOrder.role === 'CUSTOMER'
                  ? [
                      'Thay đổi ý định mua hàng',
                      'Muốn thay đổi địa chỉ / số điện thoại nhận hàng',
                      'Tìm thấy sản phẩm giá tốt hơn',
                    ]
                  : [
                      'Hết hàng (Báo hủy cho ĐVVC)',
                      'Sản phẩm lỗi kiểm tra trước khi xuất kho',
                      'Không liên lạc được với khách hàng',
                    ]
                ).map((preset) => (
                  <label
                    key={preset}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: cancelReasonText === preset ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                      background: cancelReasonText === preset ? '#eef2ff' : '#f8fafc',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="cancelReasonPreset"
                      checked={cancelReasonText === preset}
                      onChange={() => setCancelReasonText(preset)}
                      style={{ marginRight: 8 }}
                    />
                    {preset}
                  </label>
                ))}
              </div>

              <input
                className="input"
                placeholder="Hoặc nhập lý do khác..."
                required
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-outline" onClick={() => setCancellingOrder(null)}>
                  Giữ lại đơn
                </button>
                <button type="submit" className="btn btn-danger">
                  Xác nhận Hủy đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THÔNG BÁO NỔI Ở GIỮA MÀN HÌNH */}
      {msg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1100,
            padding: 16,
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              background: '#1e1b4b',
              color: '#fff',
              padding: '14px 20px',
              borderRadius: 12,
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              maxWidth: 420,
              opacity: isClosingToast ? 0 : 1,
              transition: 'opacity 0.3s ease',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <span style={{ flex: 1 }}>{msg}</span>
            <button
              onClick={() => setMsg('')}
              style={{ background: 'transparent', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 15 }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 }}>
      <button
        type="button"
        className="btn btn-outline"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Trước
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
          style={
            currentPage === page
              ? { background: '#4f46e5', borderColor: '#4f46e5', color: '#fff' }
              : undefined
          }
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="btn btn-outline"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Sau →
      </button>
    </div>
  );
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('market');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    pass: '',
    otp: '',
    accountType: 'CUSTOMER',
    shopName: '',
  });
  const [otpSent, setOtpSent] = useState(false);

  // Thông báo nổi
  const [msg, setMsg] = useState('');
  const [isClosingToast, setIsClosingToast] = useState(false);

  // Dữ liệu sàn
  const [products, setProducts] = useState<any[]>([]);
  const [selectedShopView, setSelectedShopView] = useState<{ id: string; name: string } | null>(null);

  // Người mua
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
  const [checkoutForm, setCheckoutForm] = useState({ quantity: 1, buyerPhone: '', shippingAddress: '' });
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [editingBuyerOrder, setEditingBuyerOrder] = useState<any>(null);
  const [buyerEditForm, setBuyerEditForm] = useState({ buyerPhone: '', shippingAddress: '' });

  // Modal Hủy đơn hàng & Xóa sản phẩm
  const [cancellingOrder, setCancellingOrder] = useState<{
    id: string;
    role: 'CUSTOMER' | 'SHOP_OWNER';
    productName?: string;
  } | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [expandedCancelIds, setExpandedCancelIds] = useState<Record<string, boolean>>({});
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(null);

  // Người bán
  const [myShop, setMyShop] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState({ name: '', sku: '', price: '', stock: '10', imageUrl: '' });

  // Admin
  const [adminShops, setAdminShops] = useState<any[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [selectedAdminShopId, setSelectedAdminShopId] = useState<string | null>(null);
  const [selectedAdminCustomer, setSelectedAdminCustomer] = useState<any>(null);

  // Phân trang
  const [publicProdPage, setPublicProdPage] = useState(1);
  const [buyerOrderPage, setBuyerOrderPage] = useState(1);
  const [sellerProdPage, setSellerProdPage] = useState(1);
  const [sellerOrderPage, setSellerOrderPage] = useState(1);
  const [adminShopPage, setAdminShopPage] = useState(1);
  const [adminShopProdPage, setAdminShopProdPage] = useState(1);
  const [adminUserPage, setAdminUserPage] = useState(1);
  const [adminUserOrderPage, setAdminUserOrderPage] = useState(1);

  const showToast = (text: string) => {
    setIsClosingToast(false);
    setMsg(text);
  };

  const toggleCancelReason = (orderId: string) => {
    setExpandedCancelIds((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const renderStatusBadge = (orderId: string, status: string, cancelReason?: string) => {
    if (status === 'DELIVERED') {
      return (
        <span className="badge" style={{ background: '#dcfce7', color: '#15803d', whiteSpace: 'nowrap' }}>
          Giao thành công
        </span>
      );
    }
    if (status === 'HANDED_OVER') {
      return (
        <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', whiteSpace: 'nowrap' }}>
          Đang giao hàng
        </span>
      );
    }
    if (status === 'CANCELLED') {
      const isExpanded = !!expandedCancelIds[orderId];
      return (
        <div>
          <button
            type="button"
            onClick={() => toggleCancelReason(orderId)}
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
            }}
            title="Bấm để xem lý do hủy"
          >
            <span>Đã hủy đơn</span>
            <span>{isExpanded ? '▲' : '▼'}</span>
          </button>

          {isExpanded && (
            <div
              style={{
                fontSize: 12,
                color: '#991b1b',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '6px 8px',
                borderRadius: 6,
                marginTop: 6,
                maxWidth: 220,
              }}
            >
              <b>Lý do hủy:</b> {cancelReason || 'Không có ghi chú'}
            </div>
          )}
        </div>
      );
    }
    return (
      <span className="badge" style={{ background: '#fef3c7', color: '#b45309', whiteSpace: 'nowrap' }}>
        Đang xử lý
      </span>
    );
  };

  // --- HELPER LƯU & ĐỌC SĐT / ĐỊA CHỈ CŨ ---
  const getSavedShippingKey = (u: any) => `saved_shipping_${u?.userId || u?.id || u?.email}`;

  const saveBuyerShippingProfile = (phone: string, address: string) => {
    if (!user) return;
    localStorage.setItem(
      getSavedShippingKey(user),
      JSON.stringify({ buyerPhone: phone.trim(), shippingAddress: address.trim() }),
    );
  };

  const loadBuyerShippingProfile = (ordersList: any[]) => {
    if (!user) return { buyerPhone: '', shippingAddress: '' };
    const savedRaw = localStorage.getItem(getSavedShippingKey(user));
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (parsed.buyerPhone || parsed.shippingAddress) return parsed;
      } catch {}
    }
    if (ordersList.length > 0 && ordersList[0].buyerPhone) {
      return {
        buyerPhone: ordersList[0].buyerPhone,
        shippingAddress: ordersList[0].shippingAddress || '',
      };
    }
    return { buyerPhone: '', shippingAddress: '' };
  };

  const loadPublicProducts = async () => {
    try {
      const res = await marketplaceApi.getAllProducts();
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUserContext = async (isInitialLogin = false) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const profileRes = await authApi.getProfile();
      const currentUser = profileRes.data;
      setUser(currentUser);

      if (currentUser.role === 'CUSTOMER') {
        if (isInitialLogin) setActiveTab('market');
        const myOrdersRes = await marketplaceApi.getMyOrders();
        setMyOrders(Array.isArray(myOrdersRes.data) ? myOrdersRes.data : []);
      } else if (currentUser.role === 'SHOP_OWNER') {
        if (isInitialLogin) setActiveTab('shop-products');
        const [shopRes, myProdRes, orderRes] = await Promise.all([
          marketplaceApi.getMyShop(),
          marketplaceApi.getMyProducts(),
          marketplaceApi.getMyShopOrders(),
        ]);
        setMyShop(shopRes.data);
        setMyProducts(Array.isArray(myProdRes.data) ? myProdRes.data : []);
        setShopOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
      } else if (currentUser.role === 'SUPER_ADMIN') {
        if (isInitialLogin) setActiveTab('admin-shops');
        const [shopsRes, ordersRes, customersRes] = await Promise.all([
          marketplaceApi.getAllShopsAdmin(),
          marketplaceApi.getAllOrdersAdmin(),
          marketplaceApi.getAllCustomersAdmin(),
        ]);
        setAdminShops(Array.isArray(shopsRes.data) ? shopsRes.data : []);
        setAdminOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setAdminCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      }
    } catch {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  useEffect(() => {
    loadPublicProducts();
    loadUserContext(true);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const fadeTimer = setTimeout(() => setIsClosingToast(true), 1700);
    const clearTimer = setTimeout(() => {
      setMsg('');
      setIsClosingToast(false);
    }, 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [msg]);

  // --- AUTH ---
  const handleSendOtp = async () => {
    if (!EMAIL_REGEX.test(authForm.email.trim())) {
      return showToast('Định dạng Email không hợp lệ! (VD: tenban@gmail.com)');
    }
    try {
      const res = await authApi.sendOtp(authForm.email.trim());
      setOtpSent(true);
      showToast(res.data.message);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi gửi OTP');
    }
  };

  const handleAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!EMAIL_REGEX.test(authForm.email.trim())) {
      return showToast('Vui lòng nhập đúng định dạng Email!');
    }
    try {
      if (authMode === 'register') {
        if (!authForm.otp.trim()) return showToast('Vui lòng nhập mã OTP gửi về Email!');
        await authApi.register(authForm);
        showToast('Đăng ký thành công! Hãy bấm Đăng nhập.');
        setAuthMode('login');
        setOtpSent(false);
      } else {
        const res = await authApi.login({ email: authForm.email, pass: authForm.pass });
        localStorage.setItem('access_token', res.data.access_token);
        showToast('Đăng nhập thành công!');
        await loadUserContext(true);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Sai thông tin đăng nhập');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setMyShop(null);
    setMyProducts([]);
    setShopOrders([]);
    setMyOrders([]);
    setAdminShops([]);
    setAdminCustomers([]);
    setAdminOrders([]);
    setSelectedAdminShopId(null);
    setSelectedAdminCustomer(null);
    setSelectedShopView(null);
    setActiveTab('market');
    showToast('Đã đăng xuất.');
  };

  // --- SHOP OWNER ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return showToast('Chọn ảnh nhỏ hơn 4MB!');
    const reader = new FileReader();
    reader.onloadend = () => setProdForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myShop && !myShop.isActive) return showToast('Cửa hàng đã bị khóa! Vui lòng liên hệ Admin.');
    try {
      const payload = {
        name: prodForm.name,
        sku: prodForm.sku,
        price: Number(prodForm.price),
        stock: Number(prodForm.stock),
        imageUrl: prodForm.imageUrl || undefined,
      };
      if (editingProductId) {
        await marketplaceApi.updateProduct(editingProductId, payload);
        showToast('Cập nhật sản phẩm thành công!');
      } else {
        await marketplaceApi.createProduct(payload);
        showToast('Đăng bán sản phẩm mới thành công!');
      }
      setEditingProductId(null);
      setProdForm({ name: '', sku: '', price: '', stock: '10', imageUrl: '' });
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi lưu sản phẩm');
    }
  };

  const startEditProduct = (p: any) => {
    setEditingProductId(p.id);
    setProdForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      stock: String(p.stock),
      imageUrl: p.imageUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await marketplaceApi.deleteProduct(deletingProduct.id);
      showToast(`Đã xóa sản phẩm "${deletingProduct.name}"!`);
      setDeletingProduct(null);
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi xóa sản phẩm');
    }
  };

  const handleShopOrderStatus = async (
    orderId: string,
    status: 'PREPARING' | 'HANDED_OVER' | 'DELIVERED' | 'CANCELLED',
    reason?: string,
  ) => {
    try {
      await marketplaceApi.updateShopOrderStatus(orderId, { status, cancelReason: reason });
      showToast('Đã cập nhật trạng thái đơn hàng!');
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  // --- CUSTOMER ---
  const openCheckoutModal = (product: any) => {
    if (!user) {
      showToast('Vui lòng đăng nhập tài khoản Người mua để đặt hàng!');
      setActiveTab('auth');
      return;
    }
    if (user.role !== 'CUSTOMER') return showToast('Chỉ tài khoản Người mua mới được đặt hàng!');

    const savedInfo = loadBuyerShippingProfile(myOrders);
    setCheckoutProduct(product);
    setCheckoutForm({
      quantity: 1,
      buyerPhone: savedInfo.buyerPhone,
      shippingAddress: savedInfo.shippingAddress,
    });
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutProduct) return;
    try {
      await marketplaceApi.createOrder({
        productId: checkoutProduct.id,
        quantity: Number(checkoutForm.quantity),
        buyerPhone: checkoutForm.buyerPhone,
        shippingAddress: checkoutForm.shippingAddress,
      });
      saveBuyerShippingProfile(checkoutForm.buyerPhone, checkoutForm.shippingAddress);
      showToast(`Đặt mua thành công "${checkoutProduct.name}"!`);
      setCheckoutProduct(null);
      await loadPublicProducts();
      await loadUserContext(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi đặt hàng');
    }
  };

  const handleSaveBuyerAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuyerOrder) return;
    try {
      await marketplaceApi.updateOrderBuyerInfo(editingBuyerOrder.id, buyerEditForm);
      saveBuyerShippingProfile(buyerEditForm.buyerPhone, buyerEditForm.shippingAddress);
      showToast('Đã cập nhật SĐT và Địa chỉ nhận hàng!');
      setEditingBuyerOrder(null);
      await loadUserContext(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật địa chỉ');
    }
  };

  const handleConfirmCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    const finalReason = cancelReasonText.trim() || 'Hủy đơn hàng';

    try {
      if (cancellingOrder.role === 'CUSTOMER') {
        await marketplaceApi.cancelOrderByBuyer(cancellingOrder.id, finalReason);
      } else {
        await marketplaceApi.updateShopOrderStatus(cancellingOrder.id, {
          status: 'CANCELLED',
          cancelReason: finalReason,
        });
      }
      showToast('Đã hủy đơn hàng thành công!');
      setCancellingOrder(null);
      setCancelReasonText('');
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể hủy đơn hàng');
    }
  };

  // --- ADMIN ---
  const handleToggleShop = async (shopId: string, currentStatus: boolean) => {
    try {
      await marketplaceApi.toggleShopStatus(shopId, !currentStatus);
      showToast(!currentStatus ? 'Đã mở khóa Gian hàng!' : 'Đã khóa Gian hàng!');
      await loadUserContext(false);
      await loadPublicProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi đổi trạng thái shop');
    }
  };

  const displayedProducts = selectedShopView
    ? products.filter((p) => p.shop?.id === selectedShopView.id)
    : products;

  const selectedAdminShop = selectedAdminShopId
    ? adminShops.find((s) => s.id === selectedAdminShopId) || null
    : null;

  const selectedCustomerOrders = selectedAdminCustomer
    ? adminOrders.filter(
        (o) => o.buyerId === selectedAdminCustomer.id || o.buyerName === selectedAdminCustomer.email,
      )
    : [];

  const shopDeliveredCount = shopOrders.filter((o) => o.status === 'DELIVERED').length;
  const shopCancelledCount = shopOrders.filter((o) => o.status === 'CANCELLED').length;

  return (
    <div className="admin-shell" style={{ background: '#f1f5f9' }}>
      {/* SIDEBAR BÊN TRÁI */}
      <aside
        className="sidebar"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#e2e8f0',
          borderRight: '1px solid #1e293b',
        }}
      >
        <div
          className="sidebar-header"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
          onClick={() => {
            setSelectedShopView(null);
            setPublicProdPage(1);
            if (!user) setActiveTab('market');
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            ⚡
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 0.3, color: '#ffffff' }}>TechNova</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Sàn Công Nghệ & Phụ Kiện</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {!user && (
            <>
              <button
                className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
                style={activeTab === 'market' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('market')}
              >
                🛍️ Khám phá sản phẩm ({products.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'auth' ? 'active' : ''}`}
                style={activeTab === 'auth' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('auth')}
              >
                🔑 Đăng nhập / Đăng ký
              </button>
            </>
          )}

          {user?.role === 'CUSTOMER' && (
            <>
              <button
                className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
                style={activeTab === 'market' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('market')}
              >
                🛍️ Mua sắm công nghệ ({products.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'my-orders' ? 'active' : ''}`}
                style={activeTab === 'my-orders' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('my-orders')}
              >
                📦 Đơn hàng của tôi ({myOrders.length})
              </button>
            </>
          )}

          {user?.role === 'SHOP_OWNER' && (
            <>
              <button
                className={`nav-item ${activeTab === 'shop-products' ? 'active' : ''}`}
                style={activeTab === 'shop-products' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('shop-products')}
              >
                💻 Kho hàng của Shop ({myProducts.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'shop-orders' ? 'active' : ''}`}
                style={activeTab === 'shop-orders' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('shop-orders')}
              >
                🚚 Quản lý đơn đặt ({shopOrders.length})
              </button>
            </>
          )}

          {user?.role === 'SUPER_ADMIN' && (
            <>
              <button
                className={`nav-item ${activeTab === 'admin-shops' ? 'active' : ''}`}
                style={activeTab === 'admin-shops' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('admin-shops')}
              >
                🏢 Quản lý Gian hàng ({adminShops.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'admin-users' ? 'active' : ''}`}
                style={activeTab === 'admin-users' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('admin-users')}
              >
                👥 Quản lý Khách hàng ({adminCustomers.length})
              </button>
              <button
                className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
                style={activeTab === 'market' ? { background: '#4f46e5', color: '#ffffff', fontWeight: 700 } : { color: '#cbd5e1' }}
                onClick={() => setActiveTab('market')}
              >
                🛍️ Xem giao diện Sàn ({products.length})
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          <div>TechNova Marketplace</div>
          <div>Chính hãng • Giao hỏa tốc</div>
        </div>
      </aside>

      {/* KHUNG LÀM VIỆC CHÍNH BÊN PHẢI */}
      <div className="main-wrapper">
        <header className="topbar" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>
              {user?.role === 'SUPER_ADMIN'
                ? 'Trung tâm Điều hành Sàn TechNova'
                : user?.role === 'SHOP_OWNER'
                ? `Kênh Đối Tác Bán Hàng — ${myShop?.name || 'Gian hàng'}`
                : user?.role === 'CUSTOMER'
                ? 'Thế Giới Công Nghệ Chính Hãng'
                : activeTab === 'auth'
                ? 'Xác thực tài khoản'
                : 'Sàn Thương Mại Điện Tử Công Nghệ TechNova'}
            </span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>{user.email}</span>
              <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontWeight: 700 }}>
                {user.role}
              </span>
              <button className="btn btn-danger" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {activeTab === 'auth' ? (
                <button className="btn btn-outline" onClick={() => setActiveTab('market')}>
                  ← Quay lại Sàn sản phẩm
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  onClick={() => setActiveTab('auth')}
                >
                  Đăng nhập / Đăng ký
                </button>
              )}
            </div>
          )}
        </header>

        <main className="content-area">
          {/* BANNER GIỚI THIỆU SÀN CÔNG NGHỆ */}
          {activeTab === 'market' && !selectedShopView && (
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #312e81 55%, #0284c7 100%)',
                color: '#fff',
                borderRadius: 14,
                padding: '22px 26px',
                marginBottom: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)',
              }}
            >
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: '#38bdf8', fontWeight: 700 }}>
                  Flash Sale Công Nghệ • Bảo Hành Chính Hãng
                </div>
                <h2 style={{ margin: '6px 0', fontSize: 21, fontWeight: 800 }}>
                  Nâng Cấp Trải Nghiệm Số — Giá Tốt Từ Nhà Phân Phối
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1' }}>
                  Laptop, bàn phím cơ, tai nghe, phụ kiện và thiết bị thông minh giao nhanh tận nơi.
                </p>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                Sản phẩm sẵn kho: <b>{products.length}</b> thiết bị
              </div>
            </div>
          )}

          {/* THỐNG KÊ NHANH ADMIN */}
          {user?.role === 'SUPER_ADMIN' && (
            <div className="stats-grid">
              <div className="stat-card" style={{ borderTop: '3px solid #4f46e5' }}>
                <div className="stat-label">Tổng số Gian hàng</div>
                <div className="stat-value">{adminShops.length}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #0284c7' }}>
                <div className="stat-label">Tổng số Người mua</div>
                <div className="stat-value">{adminCustomers.length}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #16a34a' }}>
                <div className="stat-label">Sản phẩm đang bán</div>
                <div className="stat-value">{products.length}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
                <div className="stat-label">Tổng đơn toàn sàn</div>
                <div className="stat-value">{adminOrders.length}</div>
              </div>
            </div>
          )}

          {/* THỐNG KÊ NHANH NGƯỜI BÁN */}
          {user?.role === 'SHOP_OWNER' && myShop && (
            <div className="stats-grid">
              <div className="stat-card" style={{ borderTop: '3px solid #4f46e5' }}>
                <div className="stat-label">Trạng thái Gian hàng</div>
                <div className="stat-value" style={{ fontSize: 18, color: myShop.isActive ? '#16a34a' : '#dc2626' }}>
                  {myShop.isActive ? 'Đang hoạt động' : 'Bị khóa'}
                </div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #0284c7' }}>
                <div className="stat-label">Sản phẩm của Shop</div>
                <div className="stat-value">{myProducts.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Tổng đơn hàng</div>
                <div className="stat-value">{shopOrders.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Đơn giao thành công</div>
                <div className="stat-value" style={{ color: '#16a34a' }}>{shopDeliveredCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Đơn đã hủy</div>
                <div className="stat-value" style={{ color: '#dc2626' }}>{shopCancelledCount}</div>
              </div>
            </div>
          )}

          {/* 1. TAB ĐĂNG NHẬP / ĐĂNG KÝ */}
          {!user && activeTab === 'auth' && (
            <div className="panel" style={{ maxWidth: 640, margin: '12px auto', borderTop: '4px solid #4f46e5' }}>
              <div className="panel-header">
                <span className="panel-title">
                  {authMode === 'login' ? 'Đăng nhập hệ thống TechNova' : 'Đăng ký tài khoản mới'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {authMode === 'login' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                        onClick={() => handleAuthSubmit()}
                      >
                        Đăng nhập
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setAuthMode('register')}>
                        Chuyển sang Đăng ký
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                        onClick={() => handleAuthSubmit()}
                      >
                        Hoàn tất Đăng ký
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setAuthMode('login')}>
                        Quay lại Đăng nhập
                      </button>
                    </>
                  )}
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {authMode === 'register' && (
                  <>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <label
                        style={{
                          flex: 1,
                          padding: 10,
                          border: authForm.accountType === 'CUSTOMER' ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                          background: authForm.accountType === 'CUSTOMER' ? '#eef2ff' : '#fff',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="radio"
                          name="accountType"
                          value="CUSTOMER"
                          checked={authForm.accountType === 'CUSTOMER'}
                          onChange={(e) => setAuthForm({ ...authForm, accountType: e.target.value })}
                        />{' '}
                        Người mua hàng
                      </label>
                      <label
                        style={{
                          flex: 1,
                          padding: 10,
                          border: authForm.accountType === 'SHOP_OWNER' ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                          background: authForm.accountType === 'SHOP_OWNER' ? '#eef2ff' : '#fff',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="radio"
                          name="accountType"
                          value="SHOP_OWNER"
                          checked={authForm.accountType === 'SHOP_OWNER'}
                          onChange={(e) => setAuthForm({ ...authForm, accountType: e.target.value })}
                        />{' '}
                        Người bán (Mở Shop)
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        className="input"
                        style={{ flex: 1 }}
                        placeholder="Họ và tên"
                        required
                        value={authForm.name}
                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      />
                      {authForm.accountType === 'SHOP_OWNER' && (
                        <input
                          className="input"
                          style={{ flex: 1 }}
                          placeholder="Tên Gian hàng / Cửa hàng"
                          required
                          value={authForm.shopName}
                          onChange={(e) => setAuthForm({ ...authForm, shopName: e.target.value })}
                        />
                      )}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    type="email"
                    placeholder="Email (VD: tenban@gmail.com)"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  />
                  {authMode === 'register' && (
                    <button type="button" className="btn btn-outline" onClick={handleSendOtp}>
                      {otpSent ? 'Gửi lại OTP' : 'Gửi OTP về Email'}
                    </button>
                  )}
                </div>

                {authMode === 'register' && (
                  <input
                    className="input"
                    placeholder="Nhập mã OTP 6 số gửi về Email"
                    required
                    maxLength={6}
                    value={authForm.otp}
                    onChange={(e) => setAuthForm({ ...authForm, otp: e.target.value })}
                  />
                )}

                <input
                  className="input"
                  type="password"
                  placeholder="Mật khẩu"
                  required
                  value={authForm.pass}
                  onChange={(e) => setAuthForm({ ...authForm, pass: e.target.value })}
                />
                <button type="submit" style={{ display: 'none' }} />
              </form>
            </div>
          )}

          {/* 2. ADMIN TAB 1: QUẢN LÝ NGƯỜI BÁN */}
          {user?.role === 'SUPER_ADMIN' && activeTab === 'admin-shops' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Danh sách Người bán & Gian hàng ({adminShops.length} Shop)</span>
              </div>

              {adminShops.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14 }}>Chưa có cửa hàng nào trên sàn.</p>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tên Gian hàng</th>
                        <th>Chủ sở hữu</th>
                        <th>Số sản phẩm</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(adminShops, adminShopPage, 5).map((shop) => {
                        const isSelected = selectedAdminShopId === shop.id;
                        return (
                          <tr key={shop.id} style={{ background: isSelected ? '#eef2ff' : 'transparent' }}>
                            <td><b>{shop.name}</b></td>
                            <td>
                              {shop.owner?.name}<br />
                              <small style={{ color: '#64748b' }}>{shop.owner?.email}</small>
                            </td>
                            <td>
                              <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                {shop.products?.length || 0} sản phẩm
                              </span>
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{
                                  background: shop.isActive ? '#dcfce7' : '#fee2e2',
                                  color: shop.isActive ? '#15803d' : '#b91c1c',
                                }}
                              >
                                {shop.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                                  style={isSelected ? { background: '#4f46e5', borderColor: '#4f46e5' } : undefined}
                                  onClick={() => {
                                    setSelectedAdminShopId(isSelected ? null : shop.id);
                                    setAdminShopProdPage(1);
                                  }}
                                >
                                  {isSelected ? 'Đóng chi tiết ▲' : 'Xem chi tiết ▼'}
                                </button>
                                <button
                                  className={`btn ${shop.isActive ? 'btn-danger' : 'btn-success'}`}
                                  onClick={() => handleToggleShop(shop.id, shop.isActive)}
                                >
                                  {shop.isActive ? 'Khóa Shop' : 'Mở khóa'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <PaginationBar
                    currentPage={adminShopPage}
                    totalItems={adminShops.length}
                    pageSize={5}
                    onPageChange={setAdminShopPage}
                  />
                </>
              )}

              {selectedAdminShop && (
                <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <strong>
                      Chi tiết sản phẩm của Shop: {selectedAdminShop.name} ({selectedAdminShop.products?.length || 0} món)
                    </strong>
                    <button className="btn btn-outline" onClick={() => setSelectedAdminShopId(null)}>✕</button>
                  </div>

                  {!selectedAdminShop.products || selectedAdminShop.products.length === 0 ? (
                    <p style={{ fontSize: 14, color: '#64748b' }}>Cửa hàng này chưa đăng sản phẩm nào.</p>
                  ) : (
                    <>
                      <table className="data-table" style={{ background: '#fff' }}>
                        <thead>
                          <tr>
                            <th>Ảnh</th>
                            <th>Tên sản phẩm</th>
                            <th>Mã SKU</th>
                            <th>Giá bán</th>
                            <th>Tồn kho</th>
                            <th>Thao tác Admin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(selectedAdminShop.products, adminShopProdPage, 5).map((prod: any) => (
                            <tr key={prod.id}>
                              <td>
                                {prod.imageUrl ? (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }}
                                  />
                                ) : (
                                  <span style={{ fontSize: 22 }}>💻</span>
                                )}
                              </td>
                              <td><b>{prod.name}</b></td>
                              <td>{prod.sku}</td>
                              <td style={{ color: '#4f46e5', fontWeight: 700 }}>{prod.price.toLocaleString('vi-VN')} ₫</td>
                              <td>{prod.stock}</td>
                              <td>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => setDeletingProduct({ id: prod.id, name: prod.name })}
                                >
                                  Xóa sản phẩm
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <PaginationBar
                        currentPage={adminShopProdPage}
                        totalItems={selectedAdminShop.products.length}
                        pageSize={5}
                        onPageChange={setAdminShopProdPage}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. ADMIN TAB 2: QUẢN LÝ NGƯỜI MUA */}
          {user?.role === 'SUPER_ADMIN' && activeTab === 'admin-users' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Danh sách Người mua ({adminCustomers.length} tài khoản)</span>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Ngày đăng ký</th>
                    <th>Số đơn đã đặt</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(adminCustomers, adminUserPage, 5).map((cust) => {
                    const count = adminOrders.filter(
                      (o) => o.buyerId === cust.id || o.buyerName === cust.email,
                    ).length;
                    const isSelected = selectedAdminCustomer?.id === cust.id;
                    return (
                      <tr key={cust.id} style={{ background: isSelected ? '#eef2ff' : 'transparent' }}>
                        <td><b>{cust.name}</b></td>
                        <td>{cust.email}</td>
                        <td>{new Date(cust.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                            {count} đơn
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                            style={isSelected ? { background: '#4f46e5', borderColor: '#4f46e5' } : undefined}
                            onClick={() => {
                              setSelectedAdminCustomer(isSelected ? null : cust);
                              setAdminUserOrderPage(1);
                            }}
                          >
                            {isSelected ? 'Đóng chi tiết ▲' : 'Xem chi tiết ▼'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <PaginationBar
                currentPage={adminUserPage}
                totalItems={adminCustomers.length}
                pageSize={5}
                onPageChange={setAdminUserPage}
              />

              {selectedAdminCustomer && (
                <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <strong>Chi tiết đơn hàng của: {selectedAdminCustomer.name} ({selectedAdminCustomer.email})</strong>
                    <button className="btn btn-outline" onClick={() => setSelectedAdminCustomer(null)}>✕</button>
                  </div>

                  {selectedCustomerOrders.length === 0 ? (
                    <p style={{ fontSize: 14, color: '#64748b' }}>Người dùng này chưa đặt đơn hàng nào.</p>
                  ) : (
                    <>
                      <table className="data-table" style={{ background: '#fff' }}>
                        <thead>
                          <tr>
                            <th>Mã đơn</th>
                            <th>Sản phẩm & Shop</th>
                            <th>SĐT & Địa chỉ nhận</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(selectedCustomerOrders, adminUserOrderPage, 5).map((o) => (
                            <tr key={o.id}>
                              <td>#{o.id.slice(0, 8).toUpperCase()}</td>
                              <td><b>{o.productName}</b> (x{o.quantity}) — Shop: {o.shop?.name}</td>
                              <td>{o.buyerPhone} — {o.shippingAddress}</td>
                              <td style={{ fontWeight: 700, color: '#4f46e5' }}>{o.totalAmount.toLocaleString('vi-VN')} ₫</td>
                              <td>{renderStatusBadge(o.id, o.status, o.cancelReason)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <PaginationBar
                        currentPage={adminUserOrderPage}
                        totalItems={selectedCustomerOrders.length}
                        pageSize={5}
                        onPageChange={setAdminUserOrderPage}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. SHOP OWNER TAB 1: QUẢN LÝ SẢN PHẨM CỦA RIÊNG SHOP */}
          {user?.role === 'SHOP_OWNER' && myShop && activeTab === 'shop-products' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Sản phẩm của Cửa hàng ({myProducts.length})</span>
              </div>

              {!myShop.isActive ? (
                <div style={{ padding: 14, background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 20, fontWeight: 600 }}>
                  ⚠️ Shop của bạn đã bị khóa! Bạn không thể đăng hoặc sửa sản phẩm. Vui lòng liên hệ Admin.
                </div>
              ) : (
                <form
                  onSubmit={handleSaveProduct}
                  style={{
                    background: '#eef2ff',
                    padding: 16,
                    borderRadius: 10,
                    marginBottom: 20,
                    border: '1px solid #c7d2fe',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10, color: '#1e1b4b' }}>
                    {editingProductId ? '✏️ Chỉnh sửa sản phẩm' : '⚡ Đăng bán sản phẩm mới'}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <input className="input" style={{ flex: 1 }} placeholder="Tên sản phẩm" required value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} />
                    <input className="input" style={{ flex: 1 }} placeholder="Mã SKU" required value={prodForm.sku} onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })} />
                    <input className="input" style={{ flex: 1 }} type="number" placeholder="Giá bán" required value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} />
                    <input className="input" style={{ flex: 1 }} type="number" placeholder="Tồn kho" required value={prodForm.stock} onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    {prodForm.imageUrl && (
                      <img src={prodForm.imageUrl} alt="preview" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      {editingProductId && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => {
                            setEditingProductId(null);
                            setProdForm({ name: '', sku: '', price: '', stock: '10', imageUrl: '' });
                          }}
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                      >
                        {editingProductId ? 'Lưu cập nhật' : 'Đăng sản phẩm'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="product-grid">
                {paginate(myProducts, sellerProdPage, 4).map((p) => (
                  <div key={p.id} className="product-card" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: 160, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                        💻
                      </div>
                    )}
                    <div className="product-body">
                      <div style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>{myShop.name}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, margin: '4px 0', color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontWeight: 800, color: '#4f46e5', fontSize: 16 }}>{p.price.toLocaleString('vi-VN')} ₫</div>
                      <div style={{ fontSize: 12, color: '#64748b', margin: '6px 0 12px' }}>SKU: {p.sku} | Kho: {p.stock}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        <button className="btn btn-outline" style={{ flex: 1 }} disabled={!myShop.isActive} onClick={() => startEditProduct(p)}>Sửa</button>
                        <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setDeletingProduct({ id: p.id, name: p.name })}>Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <PaginationBar currentPage={sellerProdPage} totalItems={myProducts.length} pageSize={4} onPageChange={setSellerProdPage} />
            </div>
          )}

          {/* 5. SHOP OWNER TAB 2: QUẢN LÝ ĐƠN HÀNG */}
          {user?.role === 'SHOP_OWNER' && myShop && activeTab === 'shop-orders' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Quản lý Đơn hàng của Shop ({shopOrders.length} tổng đơn)</span>
              </div>

              {shopOrders.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14 }}>Chưa có đơn hàng nào.</p>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Sản phẩm</th>
                        <th>Khách nhận & SĐT</th>
                        <th>Địa chỉ</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Xử lý vận chuyển</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(shopOrders, sellerOrderPage, 5).map((o) => (
                        <tr key={o.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td><b>{o.productName}</b> (x{o.quantity})</td>
                          <td>{o.buyerName}<br /><small>{o.buyerPhone}</small></td>
                          <td>{o.shippingAddress}</td>
                          <td style={{ fontWeight: 700, whiteSpace: 'nowrap', color: '#4f46e5' }}>{o.totalAmount.toLocaleString('vi-VN')} ₫</td>
                          <td>{renderStatusBadge(o.id, o.status, o.cancelReason)}</td>
                          <td>
                            {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' ? (
                              <select
                                className="input"
                                style={{
                                  padding: '6px 10px',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  minWidth: 190,
                                  borderColor: '#cbd5e1',
                                }}
                                value={o.status}
                                onChange={(e) => {
                                  const nextStatus = e.target.value as
                                    | 'PREPARING'
                                    | 'HANDED_OVER'
                                    | 'DELIVERED'
                                    | 'CANCELLED';
                                  if (nextStatus === 'CANCELLED') {
                                    setCancellingOrder({
                                      id: o.id,
                                      role: 'SHOP_OWNER',
                                      productName: o.productName,
                                    });
                                    setCancelReasonText('Hết hàng (Báo hủy cho ĐVVC)');
                                  } else {
                                    handleShopOrderStatus(o.id, nextStatus);
                                  }
                                }}
                              >
                                <option value="PREPARING">Đang xử lý</option>
                                <option value="HANDED_OVER">Đang giao hàng</option>
                                <option value="DELIVERED">Giao thành công</option>
                                <option value="CANCELLED">Hủy đơn (Nhập lý do)...</option>
                              </select>
                            ) : (
                              <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>Đã hoàn tất</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginationBar currentPage={sellerOrderPage} totalItems={shopOrders.length} pageSize={5} onPageChange={setSellerOrderPage} />
                </>
              )}
            </div>
          )}

          {/* 6. CUSTOMER TAB: ĐƠN HÀNG CỦA TÔI */}
          {user?.role === 'CUSTOMER' && activeTab === 'my-orders' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Đơn hàng đã mua ({myOrders.length})</span>
              </div>

              {myOrders.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14 }}>Bạn chưa đặt mua đơn hàng nào.</p>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Sản phẩm & Shop</th>
                        <th>SĐT & Địa chỉ nhận</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(myOrders, buyerOrderPage, 5).map((o) => (
                        <tr key={o.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td><b>{o.productName}</b> (x{o.quantity})<br /><small>Shop: {o.shop?.name}</small></td>
                          <td>{o.buyerPhone}<br /><small>{o.shippingAddress}</small></td>
                          <td style={{ fontWeight: 700, color: '#4f46e5', whiteSpace: 'nowrap' }}>{o.totalAmount.toLocaleString('vi-VN')} ₫</td>
                          <td>{renderStatusBadge(o.id, o.status, o.cancelReason)}</td>
                          <td>
                            {o.status === 'PREPARING' ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="btn btn-outline"
                                  onClick={() => {
                                    setEditingBuyerOrder(o);
                                    setBuyerEditForm({ buyerPhone: o.buyerPhone || '', shippingAddress: o.shippingAddress || '' });
                                  }}
                                >
                                  Đổi SĐT / ĐC
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => {
                                    setCancellingOrder({ id: o.id, role: 'CUSTOMER', productName: o.productName });
                                    setCancelReasonText('Thay đổi ý định mua hàng');
                                  }}
                                >
                                  Hủy đơn
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>Khóa chỉnh sửa</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginationBar currentPage={buyerOrderPage} totalItems={myOrders.length} pageSize={5} onPageChange={setBuyerOrderPage} />
                </>
              )}
            </div>
          )}

          {/* 7. TAB SÀN SẢN PHẨM */}
          {user?.role !== 'SHOP_OWNER' && activeTab === 'market' && (
            <div className="panel" style={{ borderRadius: 14 }}>
              <div className="panel-header">
                <span className="panel-title" style={{ color: '#0f172a' }}>
                  {selectedShopView
                    ? `Gian hàng: ${selectedShopView.name} (${displayedProducts.length} sản phẩm)`
                    : `Sản phẩm công nghệ nổi bật (${displayedProducts.length})`}
                </span>
                {selectedShopView && (
                  <button className="btn btn-outline" onClick={() => setSelectedShopView(null)}>
                    ← Xem tất cả sản phẩm
                  </button>
                )}
              </div>

              <div className="product-grid">
                {paginate(displayedProducts, publicProdPage, 8).map((p) => (
                  <div
                    key={p.id}
                    className="product-card"
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
                    }}
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: 165, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: 165, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>
                        💻
                      </div>
                    )}
                    <div className="product-body">
                      <div
                        style={{
                          fontSize: 12,
                          color: '#4f46e5',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onClick={() => {
                          if (p.shop?.id) {
                            setSelectedShopView({ id: p.shop.id, name: p.shop.name });
                            setPublicProdPage(1);
                          }
                        }}
                      >
                        <span>🏢 {p.shop?.name}</span>
                        <span style={{ fontWeight: 400, color: '#64748b' }}>(Xem Shop)</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, margin: '6px 0', color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontWeight: 800, color: '#dc2626', fontSize: 17 }}>{p.price.toLocaleString('vi-VN')} ₫</div>
                      <div style={{ fontSize: 12, color: '#64748b', margin: '6px 0 12px' }}>Còn lại: {p.stock} sản phẩm</div>

                      {(!user || user.role === 'CUSTOMER') && (
                        <button
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            marginTop: 'auto',
                            background: p.shop?.isActive === false || p.stock <= 0 ? '#94a3b8' : '#4f46e5',
                            borderColor: p.shop?.isActive === false || p.stock <= 0 ? '#94a3b8' : '#4f46e5',
                            fontWeight: 600,
                          }}
                          disabled={p.stock <= 0 || p.shop?.isActive === false}
                          onClick={() => openCheckoutModal(p)}
                        >
                          {p.shop?.isActive === false ? 'Shop tạm khóa' : p.stock > 0 ? 'Mua ngay' : 'Hết hàng'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <PaginationBar currentPage={publicProdPage} totalItems={displayedProducts.length} pageSize={8} onPageChange={setPublicProdPage} />
            </div>
          )}
        </main>
      </div>

      {/* MODAL XÁC NHẬN XÓA SẢN PHẨM Ở GIỮA MÀN HÌNH */}
      {deletingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="panel" style={{ width: 420, maxWidth: '100%', margin: 0, textAlign: 'center', padding: 24, borderRadius: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>Xác nhận xóa sản phẩm</h3>
            <p style={{ fontSize: 14, color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa sản phẩm <b>"{deletingProduct.name}"</b> không?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setDeletingProduct(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={confirmDeleteProduct}
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐẶT HÀNG */}
      {checkoutProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="panel" style={{ width: 440, margin: 0, borderRadius: 14 }}>
            <div className="panel-header">
              <span className="panel-title" style={{ color: '#1e1b4b' }}>Thông tin nhận hàng</span>
              <button className="btn btn-outline" onClick={() => setCheckoutProduct(null)}>✕</button>
            </div>
            <p style={{ fontSize: 14, marginBottom: 12 }}>
              Món hàng: <b>{checkoutProduct.name}</b> — Shop: <b>{checkoutProduct.shop?.name}</b>
              <br />
              <span style={{ color: '#dc2626', fontWeight: 700 }}>
                Tổng thanh toán:{' '}
                {(checkoutProduct.price * (Number(checkoutForm.quantity) || 1)).toLocaleString('vi-VN')} ₫
              </span>
            </p>
            <form onSubmit={handleConfirmPurchase} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" type="number" min={1} max={checkoutProduct.stock} required placeholder="Số lượng" value={checkoutForm.quantity} onChange={(e) => setCheckoutForm({ ...checkoutForm, quantity: Number(e.target.value) })} />
              <input className="input" required placeholder="Số điện thoại người nhận (10 số)" value={checkoutForm.buyerPhone} onChange={(e) => setCheckoutForm({ ...checkoutForm, buyerPhone: e.target.value })} />
              <input className="input" required placeholder="Địa chỉ giao hàng chi tiết" value={checkoutForm.shippingAddress} onChange={(e) => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                {(checkoutForm.buyerPhone || checkoutForm.shippingAddress) ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: 12, padding: '6px 10px' }}
                    onClick={() => {
                      if (user) localStorage.removeItem(getSavedShippingKey(user));
                      setCheckoutForm({ ...checkoutForm, buyerPhone: '', shippingAddress: '' });
                    }}
                  >
                    Nhập địa chỉ mới
                  </button>
                ) : <span />}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setCheckoutProduct(null)}>Hủy</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  >
                    Xác nhận đặt mua
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI SĐT / ĐỊA CHỈ */}
      {editingBuyerOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="panel" style={{ width: 420, margin: 0, borderRadius: 14 }}>
            <div className="panel-header">
              <span className="panel-title">Đổi SĐT & Địa chỉ nhận</span>
              <button className="btn btn-outline" onClick={() => setEditingBuyerOrder(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveBuyerAddress} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" required placeholder="Số điện thoại mới" value={buyerEditForm.buyerPhone} onChange={(e) => setBuyerEditForm({ ...buyerEditForm, buyerPhone: e.target.value })} />
              <input className="input" required placeholder="Địa chỉ mới" value={buyerEditForm.shippingAddress} onChange={(e) => setBuyerEditForm({ ...buyerEditForm, shippingAddress: e.target.value })} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingBuyerOrder(null)}>Đóng</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LÝ DO HỦY ĐƠN HÀNG */}
      {cancellingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="panel" style={{ width: 440, margin: 0, borderRadius: 14 }}>
            <div className="panel-header">
              <span className="panel-title" style={{ color: '#dc2626' }}>Xác nhận Hủy đơn hàng</span>
              <button className="btn btn-outline" onClick={() => setCancellingOrder(null)}>✕</button>
            </div>
            {cancellingOrder.productName && (
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
                Sản phẩm: <b>{cancellingOrder.productName}</b>
              </p>
            )}

            <form onSubmit={handleConfirmCancelOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(cancellingOrder.role === 'CUSTOMER'
                  ? [
                      'Thay đổi ý định mua hàng',
                      'Muốn thay đổi địa chỉ / số điện thoại nhận hàng',
                      'Tìm thấy sản phẩm giá tốt hơn',
                    ]
                  : [
                      'Hết hàng (Báo hủy cho ĐVVC)',
                      'Sản phẩm lỗi kiểm tra trước khi xuất kho',
                      'Không liên lạc được với khách hàng',
                    ]
                ).map((preset) => (
                  <label
                    key={preset}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: cancelReasonText === preset ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                      background: cancelReasonText === preset ? '#eef2ff' : '#f8fafc',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="cancelReasonPreset"
                      checked={cancelReasonText === preset}
                      onChange={() => setCancelReasonText(preset)}
                      style={{ marginRight: 8 }}
                    />
                    {preset}
                  </label>
                ))}
              </div>

              <input
                className="input"
                placeholder="Hoặc nhập lý do khác..."
                required
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-outline" onClick={() => setCancellingOrder(null)}>
                  Giữ lại đơn
                </button>
                <button type="submit" className="btn btn-danger">
                  Xác nhận Hủy đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THÔNG BÁO NỔI Ở GIỮA MÀN HÌNH */}
      {msg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1100,
            padding: 16,
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              background: '#1e1b4b',
              color: '#fff',
              padding: '14px 20px',
              borderRadius: 12,
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              maxWidth: 420,
              opacity: isClosingToast ? 0 : 1,
              transition: 'opacity 0.3s ease',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <span style={{ flex: 1 }}>{msg}</span>
            <button
              onClick={() => setMsg('')}
              style={{ background: 'transparent', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 15 }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
