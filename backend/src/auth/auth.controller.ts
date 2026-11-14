import { Body, Controller, Post, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password 16 ký tự viết liền
  },
});

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('password') pass: string,
    @Body('name') name: string,
    @Body('otp') otp: string,
    @Body('accountType') accountType?: string,
    @Body('shopName') shopName?: string,
  ) {
    return this.authService.register(email, pass, name, otp, accountType, shopName);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body('email') email: string, @Body('password') pass: string) {
    return this.authService.login(email, pass);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  // Admin lấy danh sách người mua
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('admin/customers')
  getAllCustomersAdmin() {
    return this.authService.getAllCustomersAdmin();
  }
}
