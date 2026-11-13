import { Injectable, UnauthorizedException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService implements OnModuleInit {
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

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

  async sendOtp(email: string) {
    this.validateEmailFormat(email);
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      throw new BadRequestException('Email này đã được đăng ký trên hệ thống!');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(cleanEmail, {
      code: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"NexMarket" <${process.env.SMTP_USER}>`,
          to: cleanEmail,
          subject: 'Mã xác thực OTP đăng ký tài khoản NexMarket',
          html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:8px;">
            <h2>Xác thực tài khoản NexMarket</h2>
            <p>Mã OTP của bạn là: <b style="font-size:24px;color:#ee4d2d;letter-spacing:2px;">${otpCode}</b></p>
            <p>Mã có hiệu lực trong vòng 5 phút. Tuyệt đối không chia sẻ mã này cho người khác.</p>
          </div>`,
        });

        return { message: `Mã OTP đã được gửi tới hộp thư ${cleanEmail}. Vui lòng kiểm tra Email (kể cả mục Thư rác/Spam)!` };
      } catch (err) {
        console.error('Lỗi gửi SMTP:', err);
        throw new BadRequestException('Không thể gửi email OTP. Vui lòng kiểm tra lại cấu hình SMTP_USER / SMTP_PASS trong file .env!');
      }
    }

    // Fallback ghi vào log server khi chạy máy net chưa cấu hình SMTP, KHÔNG trả mã về giao diện web
    console.log(`\n📧 [SERVER LOG] Email nhận: ${cleanEmail} | Mã OTP: ${otpCode}\n`);
    return {
      message: `Mã OTP đã được gửi tới email ${cleanEmail}. Vui lòng kiểm tra hộp thư của bạn!`,
    };
  }

  async register(
    email: string,
    password: string,
    name: string,
    otp: string,
    accountType?: string,
    shopName?: string,
  ) {
    this.validateEmailFormat(email);
    const cleanEmail = email.trim().toLowerCase();

    const savedOtp = this.otpStore.get(cleanEmail);
    if (!savedOtp || savedOtp.expiresAt < Date.now()) {
      throw new BadRequestException('Mã OTP đã hết hạn hoặc chưa được gửi. Vui lòng bấm Gửi mã OTP!');
    }
    if (savedOtp.code !== otp?.trim()) {
      throw new BadRequestException('Mã OTP không chính xác!');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    this.otpStore.delete(cleanEmail);

    if (accountType === 'SHOP_OWNER') {
      if (!shopName?.trim()) {
        throw new BadRequestException('Vui lòng nhập tên Cửa hàng cho tài khoản Người bán!');
      }

      return this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email: cleanEmail,
            password: hashedPassword,
            role: Role.SHOP_OWNER,
          },
        });

        const shop = await tx.shop.create({
          data: {
            name: shopName.trim(),
            description: `Gian hàng chính hãng của ${name}`,
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
        name,
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
