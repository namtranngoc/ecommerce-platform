import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ShopModule } from './shop/shop.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [AuthModule, ShopModule, ProductModule, OrderModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}