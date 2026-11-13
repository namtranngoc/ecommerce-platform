import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Tự động tìm đúng Shop của chủ shop ngay cả khi token cũ thiếu shopId
  private async resolveAndVerifyShop(userId: string, tokenShopId?: string) {
    let shop:any = null;
    if (tokenShopId) {
      shop = await this.prisma.shop.findUnique({ where: { id: tokenShopId } });
    }
    if (!shop && userId) {
      shop = await this.prisma.shop.findUnique({ where: { ownerId: userId } });
    }
    if (!shop) {
      throw new ForbiddenException('Tài khoản của bạn chưa liên kết với cửa hàng nào!');
    }
    return shop;
  }

  async create(
    userId: string,
    tokenShopId: string,
    data: { name: string; sku: string; price: number; stock: number; imageUrl?: string },
  ) {
    const shop = await this.resolveAndVerifyShop(userId, tokenShopId);

    if (!shop.isActive) {
      throw new ForbiddenException('Shop của bạn đã bị khóa! Vui lòng liên hệ Admin để được hỗ trợ.');
    }

    if (!data.name?.trim() || !data.sku?.trim()) {
      throw new BadRequestException('Vui lòng nhập đầy đủ Tên sản phẩm và Mã SKU!');
    }

    return this.prisma.product.create({
      data: {
        name: data.name.trim(),
        sku: data.sku.trim(),
        price: Number(data.price) || 0,
        stock: Number(data.stock) || 0,
        imageUrl: data.imageUrl || null,
        shopId: shop.id,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        shop: {
          select: { id: true, name: true, description: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByShop(userId: string, tokenShopId: string) {
    const shop = await this.resolveAndVerifyShop(userId, tokenShopId);
    return this.prisma.product.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    productId: string,
    userId: string,
    tokenShopId: string,
    data: { name?: string; sku?: string; price?: number; stock?: number; imageUrl?: string },
  ) {
    const shop = await this.resolveAndVerifyShop(userId, tokenShopId);

    if (!shop.isActive) {
      throw new ForbiddenException('Shop của bạn đã bị khóa! Vui lòng liên hệ Admin.');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm!');
    if (product.shopId !== shop.id) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa sản phẩm của shop khác!');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.sku !== undefined && { sku: data.sku.trim() }),
        ...(data.price !== undefined && { price: Number(data.price) }),
        ...(data.stock !== undefined && { stock: Number(data.stock) }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
  }

  // Cho phép cả SHOP_OWNER (xóa đồ của mình) và SUPER_ADMIN (xóa sản phẩm bất kỳ của shop)
  async remove(productId: string, user: { userId: string; shopId?: string; role: Role }) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm!');

    if (user.role !== Role.SUPER_ADMIN) {
      const shop = await this.resolveAndVerifyShop(user.userId, user.shopId);
      if (product.shopId !== shop.id) {
        throw new ForbiddenException('Bạn không có quyền xóa sản phẩm của shop khác!');
      }
    }

    return this.prisma.product.delete({ where: { id: productId } });
  }
}