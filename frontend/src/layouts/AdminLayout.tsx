import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, LogOut, Search, Bell } from 'lucide-react';
import clsx from 'clsx';

export default function AdminLayout() {
  const location = useLocation();

  const menuItems = [
    { name: 'Tổng quan', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Sản phẩm', path: '/products', icon: <Package size={20} /> },
    { name: 'Đơn hàng', path: '/orders', icon: <ShoppingCart size={20} /> },
    { name: 'Khách hàng', path: '/users', icon: <Users size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {/* Sidebar: Giao diện tối sang trọng */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10">
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
          <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            LienQuanShop
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <div className={clsx("transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 w-full p-3 rounded-xl transition-colors">
            <LogOut size={20} /> <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header với thanh tìm kiếm và Avatar */}
        <header className="h-16 bg-white flex items-center justify-between px-8 shadow-sm z-0">
          <div className="flex items-center bg-gray-100 px-4 py-2 rounded-full w-96 focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
            <Search size={18} className="text-gray-400 mr-2" />
            <input type="text" placeholder="Tìm kiếm nhanh..." className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400" />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-blue-600 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700">Trần Ngọc Nam</p>
                <p className="text-xs text-gray-500">Quản trị viên</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:opacity-90">
                N
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-8 overflow-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}