import { Injectable, UnauthorizedException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const adminEmail = 'admin@nexmarket.vn';
    const existingAdmin = await this.prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      await this.prisma.user.create({
        data: {
          name: 'System Admin',
          email: adminEmail,
          password: hashedPassword,
          role: Role.SUPER_ADMIN,
        },
      });
    }
  }

  private validateEmailFormat(email: string) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
      throw new BadRequestException('Định dạng Email không hợp lệ (VD đúng: tenban@gmail.com)!');
    }
  }

  async register(
    email: string,
    password: string,
    name: string,
    accountType?: string,
    shopName?: string,
  ) {
    this.validateEmailFormat(email);
    const cleanEmail = email.trim().toLowerCase();

    if (!password || !name?.trim()) {
      throw new BadRequestException('Vui lòng nhập đầy đủ họ tên và mật khẩu!');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (accountType === 'SHOP_OWNER') {
      if (!shopName?.trim()) {
        throw new BadRequestException('Vui lòng nhập tên Cửa hàng cho tài khoản Người bán!');
      }

      return this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            role: Role.SHOP_OWNER,
          },
        });

        const shop = await tx.shop.create({
          data: {
            name: shopName.trim(),
            description: `Gian hàng chính hãng của ${name.trim()}`,
            ownerId: user.id,
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { shopId: shop.id },
        });

        const { password: _, ...result } = updatedUser;
        return result;
      });
    }

    const user = await this.prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: Role.CUSTOMER,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, pass: string) {
    this.validateEmailFormat(email);
    const cleanEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { ownedShop: true },
    });
    if (!user) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu!');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu!');
    }

    const resolvedShopId = user.shopId || user.ownedShop?.id || null;
    const payload = { sub: user.id, email: user.email, role: user.role, shopId: resolvedShopId };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: resolvedShopId,
      },
    };
  }

  // Admin: Lấy danh sách tất cả tài khoản Người mua (CUSTOMER)
  async getAllCustomersAdmin() {
    return this.prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
