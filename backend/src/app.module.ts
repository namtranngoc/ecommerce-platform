import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { ShopModule } from './shop/shop.module';

@Module({
  imports: [AuthModule, ShopModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}