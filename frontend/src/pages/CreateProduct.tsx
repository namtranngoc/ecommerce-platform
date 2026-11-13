import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// 1. Định nghĩa luật kiểm tra dữ liệu bằng Zod
const productSchema = z.object({
  name: z.string().min(3, 'Tên sản phẩm phải có ít nhất 3 ký tự'),
  sku: z.string().min(3, 'Mã SKU không được để trống'),
  price: z.coerce.number().min(1, 'Giá bán phải lớn hơn 0'),
  stock: z.coerce.number().min(0, 'Số lượng tồn kho không được âm'),
  category: z.string().min(1, 'Vui lòng chọn danh mục'),
  description: z.string().optional(),
});

// TypeScript type tự động sinh ra từ schema
type ProductFormValues = z.infer<typeof productSchema>;
type ProductFormInput = z.input<typeof productSchema>;

export default function CreateProduct() {
  const navigate = useNavigate();

  // 2. Khởi tạo form với react-hook-form và zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      stock: 0,
      price: 0,
    }
  });

  // 3. Hàm xử lý khi submit form hợp lệ
  const onSubmit = (data: ProductFormValues) => {
    console.log('Dữ liệu form gửi đi:', data);
    alert('Thêm sản phẩm thành công! (Xem console.log)');
    // Tạm thời quay về trang danh sách sau khi lưu
    navigate('/products'); 
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Thêm mới sản phẩm</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột 1 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
              <input
                {...register('name')}
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="VD: Áo thun nam"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã SKU *</label>
              <input
                {...register('sku')}
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="VD: AT-001"
              />
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
              <select
                {...register('category')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">-- Chọn danh mục --</option>
                <option value="clothing">Quần áo</option>
                <option value="shoes">Giày dép</option>
                <option value="accessories">Phụ kiện</option>
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
            </div>
          </div>

          {/* Cột 2 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ) *</label>
              <input
                {...register('price')}
                type="number"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tồn kho *</label>
              <input
                {...register('stock')}
                type="number"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
            </div>
          </div>
        </div>

        {/* Full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mô tả chi tiết..."
          ></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link
            to="/products"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save size={20} /> Lưu sản phẩm
          </button>
        </div>
      </form>
    </div>
  );
}