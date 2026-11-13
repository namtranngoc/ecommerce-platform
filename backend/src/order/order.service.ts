import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: {
    productId: string;
    quantity: number;
    buyerId: string;
    buyerName?: string;
    buyerPhone: string;
    shippingAddress: string;
  }) {
    if (data.quantity <= 0) throw new BadRequestException('Số lượng đặt mua phải lớn hơn 0!');

    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!data.buyerPhone || !phoneRegex.test(data.buyerPhone.trim())) {
      throw new BadRequestException('Vui lòng nhập Số điện thoại hợp lệ (10-11 số, bắt đầu bằng 0)!');
    }
    if (!data.shippingAddress || data.shippingAddress.trim().length < 5) {
      throw new BadRequestException('Vui lòng nhập đầy đủ Địa chỉ giao hàng!');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
        include: { shop: true },
      });

      if (!product) throw new NotFoundException('Sản phẩm không tồn tại!');
      if (!product.shop.isActive) {
        throw new BadRequestException('Cửa hàng này hiện đang tạm khóa, không thể đặt hàng!');
      }
      if (product.stock < data.quantity) {
        throw new BadRequestException(`Kho chỉ còn ${product.stock} sản phẩm!`);
      }

      await tx.product.update({
        where: { id: data.productId },
        data: { stock: { decrement: data.quantity } },
      });

      const totalAmount = product.price * data.quantity;
      return tx.order.create({
        data: {
          totalAmount,
          productId: product.id,
          productName: product.name,
          quantity: data.quantity,
          buyerId: data.buyerId,
          buyerName: data.buyerName || 'Khách mua hàng',
          buyerPhone: data.buyerPhone.trim(),
          shippingAddress: data.shippingAddress.trim(),
          status: OrderStatus.PREPARING,
          shopId: product.shopId,
        },
      });
    });
  }

  // Người mua xem danh sách đơn đã đặt của mình
  async getCustomerOrders(buyerId: string, buyerEmail: string) {
    return this.prisma.order.findMany({
      where: {
        OR: [{ buyerId }, { buyerName: buyerEmail }],
      },
      include: {
        shop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Chủ shop xem đơn hàng của shop mình
  async getShopOrders(userId: string, tokenShopId?: string) {
    let shopId = tokenShopId;
    if (!shopId) {
      const shop = await this.prisma.shop.findUnique({ where: { ownerId: userId } });
      shopId = shop?.id;
    }
    if (!shopId) return [];

    return this.prisma.order.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });
  }

// Chủ shop cập nhật trạng thái: Đang chuẩn bị / Đã bàn giao cho ĐVVC / Hủy đơn (kèm lý do)
  async updateStatusByShop(
    orderId: string,
    userId: string,
    tokenShopId: string | undefined,
    status: OrderStatus,
    cancelReason?: string,
  ) {
    let shopId: string | undefined = tokenShopId;
    if (!shopId) {
      const shop = await this.prisma.shop.findUnique({ where: { ownerId: userId } });
      shopId = shop?.id;
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng!');
    if (!shopId || order.shopId !== shopId) {
      throw new ForbiddenException('Không thuộc quyền quản lý của Shop bạn!');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Đơn hàng này đã bị hủy trước đó!');
    }

    return this.prisma.$transaction(async (tx) => {
      // Nếu chuyển sang Hủy đơn -> hoàn lại số lượng vào kho
      if (status === OrderStatus.CANCELLED && order.productId) {
        await tx.product
          .update({
            where: { id: order.productId },
            data: { stock: { increment: order.quantity } },
          })
          .catch(() => null);
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status,
          cancelReason:
            status === OrderStatus.CANCELLED ? cancelReason || 'Hủy bởi Người bán (Hết hàng)' : null,
        },
      });
    });
  }

  // Người mua thay đổi SĐT và Địa chỉ nhận hàng (khi đơn đang chuẩn bị)
  async updateAddressByBuyer(
    orderId: string,
    buyerId: string,
    buyerEmail: string,
    buyerPhone: string,
    shippingAddress: string,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng!');
    if (order.buyerId !== buyerId && order.buyerName !== buyerEmail) {
      throw new ForbiddenException('Bạn không có quyền sửa đơn hàng này!');
    }
    if (order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException(
        'Chỉ có thể đổi SĐT/Địa chỉ khi đơn hàng đang ở trạng thái "Đang chuẩn bị"!',
      );
    }

    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!buyerPhone || !phoneRegex.test(buyerPhone.trim())) {
      throw new BadRequestException('Số điện thoại không hợp lệ!');
    }
    if (!shippingAddress || shippingAddress.trim().length < 5) {
      throw new BadRequestException('Vui lòng nhập địa chỉ chi tiết!');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        buyerPhone: buyerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
      },
    });
  }

  // Người mua hủy đơn hàng (khi đơn đang chuẩn bị)
  async cancelOrderByBuyer(orderId: string, buyerId: string, buyerEmail: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng!');
    if (order.buyerId !== buyerId && order.buyerName !== buyerEmail) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này!');
    }
    if (order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException(
        'Đơn hàng đã bàn giao cho đơn vị vận chuyển hoặc đã hủy, không thể hủy!',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (order.productId) {
        await tx.product
          .update({
            where: { id: order.productId },
            data: { stock: { increment: order.quantity } },
          })
          .catch(() => null);
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelReason: reason?.trim() || 'Người mua yêu cầu hủy đơn',
        },
      });
    });
  }

  async getAllOrdersAdmin() {
    return this.prisma.order.findMany({
      include: {
        shop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}