import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Products from './pages/Products';
import CreateProduct from './pages/CreateProduct'; // Lấy component thêm mới

// Các trang tạm thời
const Dashboard = () => <div className="bg-white p-6 rounded-lg shadow-sm font-bold text-gray-700">Thống kê tổng quan</div>;
const Orders = () => <div className="bg-white p-6 rounded-lg shadow-sm font-bold text-gray-700">Quản lý Đơn hàng</div>;
const Users = () => <div className="bg-white p-6 rounded-lg shadow-sm font-bold text-gray-700">Quản lý Khách hàng</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          
          {/* Đã lồng Route cho phần Sản phẩm ở đây */}
          <Route path="products">
            <Route index element={<Products />} />
            <Route path="create" element={<CreateProduct />} />
          </Route>
          
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;