import { Body, Controller, Headers, Post } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Body() dto: LoginDto,
  ): Promise<{ id: string; email: string; tenantId: string }> {
    const tenantId = tenantIdHeader ?? '00000000-0000-0000-0000-000000000000';
    return this.authService.register(tenantId, dto);
  }

  @Post('login')
  async login(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Body() dto: LoginDto,
  ): Promise<{ accessToken: string }> {
    const tenantId = tenantIdHeader ?? '00000000-0000-0000-0000-000000000000';
    return this.authService.login(tenantId, dto);
  }
}
