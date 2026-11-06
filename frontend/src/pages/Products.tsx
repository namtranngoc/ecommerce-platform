import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom'; // <-- Đã thêm import Link

// Dữ liệu giả (Mock data) tạm thời trong lúc chưa kết nối Backend
const mockProducts = [
  { id: '1', name: 'Áo thun nam Basic', sku: 'AT001', price: '250.000 ₫', stock: 120, status: 'Còn hàng' },
  { id: '2', name: 'Giày Sneaker thể thao', sku: 'GS002', price: '750.000 ₫', stock: 45, status: 'Còn hàng' },
  { id: '3', name: 'Balo laptop chống nước', sku: 'BL003', price: '400.000 ₫', stock: 0, status: 'Hết hàng' },
];

export default function Products() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* Header & Nút thêm mới */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h1>
        
        {/* Đã thay đổi button thành Link để chuyển trang */}
        <Link 
          to="/products/create" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Thêm mới
        </Link>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã SKU..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bảng danh sách sản phẩm */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
              <th className="py-3 px-4 font-medium">Tên sản phẩm</th>
              <th className="py-3 px-4 font-medium">Mã SKU</th>
              <th className="py-3 px-4 font-medium">Giá bán</th>
              <th className="py-3 px-4 font-medium">Tồn kho</th>
              <th className="py-3 px-4 font-medium">Trạng thái</th>
              <th className="py-3 px-4 font-medium text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-800">{product.name}</td>
                <td className="py-3 px-4 text-gray-500">{product.sku}</td>
                <td className="py-3 px-4 text-red-600 font-medium">{product.price}</td>
                <td className="py-3 px-4">{product.stock}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="py-3 px-4 flex justify-center gap-3">
                  <button className="text-blue-500 hover:text-blue-700 transition-colors" title="Sửa">
                    <Edit size={18} />
                  </button>
                  <button className="text-red-500 hover:text-red-700 transition-colors" title="Xóa">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}