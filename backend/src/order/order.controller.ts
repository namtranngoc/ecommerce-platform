import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrderService } from './order.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  createOrder(
    @Request() req: any,
    @Body()
    body: {
      productId: string;
      quantity: number;
      buyerPhone: string;
      shippingAddress: string;
    },
  ) {
    return this.orderService.createOrder({
      productId: body.productId,
      quantity: Number(body.quantity || 1),
      buyerId: req.user.userId,
      buyerName: req.user.email,
      buyerPhone: body.buyerPhone,
      shippingAddress: body.shippingAddress,
    });
  }

  // Người mua lấy danh sách đơn của mình
  @UseGuards(AuthGuard('jwt'))
  @Get('my-orders')
  getMyOrders(@Request() req: any) {
    return this.orderService.getCustomerOrders(req.user.userId, req.user.email);
  }

  // Người mua cập nhật địa chỉ & SĐT
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/buyer-info')
  updateBuyerInfo(
    @Param('id') orderId: string,
    @Request() req: any,
    @Body() body: { buyerPhone: string; shippingAddress: string },
  ) {
    return this.orderService.updateAddressByBuyer(
      orderId,
      req.user.userId,
      req.user.email,
      body.buyerPhone,
      body.shippingAddress,
    );
  }

  // Người mua hủy đơn
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/buyer-cancel')
  cancelByBuyer(
    @Param('id') orderId: string,
    @Request() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.orderService.cancelOrderByBuyer(orderId, req.user.userId, req.user.email, reason);
  }

  // Chủ shop xem đơn hàng của shop
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.SHOP_STAFF)
  @Get('my-shop-orders')
  getMyShopOrders(@Request() req: any) {
    return this.orderService.getShopOrders(req.user.userId, req.user.shopId);
  }

  // Chủ shop cập nhật trạng thái đơn (PREPARING / HANDED_OVER / CANCELLED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.SHOP_STAFF)
  @Patch(':id/shop-status')
  updateShopOrderStatus(
    @Param('id') orderId: string,
    @Request() req: any,
    @Body() body: { status: OrderStatus; cancelReason?: string },
  ) {
    return this.orderService.updateStatusByShop(
      orderId,
      req.user.userId,
      req.user.shopId,
      body.status,
      body.cancelReason,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('admin/all')
  getAllOrdersAdmin() {
    return this.orderService.getAllOrdersAdmin();
  }
}