import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async createShop(userId: string, name: string, description?: string) {
    const existingShop = await this.prisma.shop.findUnique({ where: { ownerId: userId } });
    if (existingShop) throw new BadRequestException('Mỗi tài khoản chỉ được tạo tối đa 1 shop!');

    return this.prisma.$transaction(async (tx) => {
      const newShop = await tx.shop.create({
        data: { name, description, ownerId: userId },
      });
      await tx.user.update({
        where: { id: userId },
        data: { role: Role.SHOP_OWNER, shopId: newShop.id },
      });
      return newShop;
    });
  }

  async getMyShop(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerId: userId },
      include: {
        products: true,
        staffs: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!shop) throw new NotFoundException('Bạn chưa mở cửa hàng nào!');
    return shop;
  }

  // Admin: Lấy tất cả Shop + Chủ shop + Danh sách sản phẩm đã đăng
  async getAllShopsAdmin() {
    return this.prisma.shop.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        products: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleShopStatus(shopId: string, isActive: boolean) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Không tìm thấy shop này!');
    return this.prisma.shop.update({
      where: { id: shopId },
      data: { isActive },
    });
  }
}