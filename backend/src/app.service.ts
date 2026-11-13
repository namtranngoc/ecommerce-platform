import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Multi-vendor E-commerce API is running!';
  }
}