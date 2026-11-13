import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductService } from './product.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.SHOP_STAFF)
  @Get('my-products')
  findMyProducts(@Request() req: any) {
    return this.productService.findByShop(req.user.userId, req.user.shopId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.SHOP_STAFF)
  @Post()
  create(
    @Request() req: any,
    @Body() body: { name: string; sku: string; price: number; stock: number; imageUrl?: string },
  ) {
    return this.productService.create(req.user.userId, req.user.shopId, body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.SHOP_STAFF)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { name?: string; sku?: string; price?: number; stock?: number; imageUrl?: string },
  ) {
    return this.productService.update(id, req.user.userId, req.user.shopId, body);
  }

  // Cả Chủ Shop và Admin đều có quyền gọi xóa sản phẩm
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.productService.remove(id, req.user);
  }
}