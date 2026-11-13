import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShopService } from './shop.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async registerShop(@Request() req: any, @Body('name') name: string, @Body('description') description?: string) {
    return this.shopService.createShop(req.user.userId, name, description);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SHOP_OWNER)
  @Get('my-shop')
  async getMyShop(@Request() req: any) {
    return this.shopService.getMyShop(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('admin/all')
  async getAllShopsAdmin() {
    return this.shopService.getAllShopsAdmin();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/status')
  async updateStatus(@Param('id') shopId: string, @Body('isActive') isActive: boolean) {
    return this.shopService.toggleShopStatus(shopId, isActive);
  }
}