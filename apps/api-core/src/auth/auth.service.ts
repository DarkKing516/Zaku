import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { LoginDto } from './login.dto';

interface AccountRecord {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class AuthService {
  private readonly accounts = new Map<string, AccountRecord>();

  constructor(private readonly jwtService: JwtService) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async validatePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  generateToken(userId: string, tenantId: string): string {
    return this.jwtService.sign({ sub: userId, tenantId }, { expiresIn: '1h' });
  }

  validateToken(token: string): { sub: string; tenantId: string } {
    return this.jwtService.verify<{ sub: string; tenantId: string }>(token);
  }

  private key(tenantId: string, email: string): string {
    return `${tenantId}:${email.toLowerCase()}`;
  }

  async register(tenantId: string, dto: LoginDto): Promise<{ id: string; email: string; tenantId: string }> {
    const normalizedEmail = dto.email.toLowerCase();
    const key = this.key(tenantId, normalizedEmail);
    if (this.accounts.has(key)) {
      throw new UnauthorizedException('User already exists');
    }

    const account: AccountRecord = {
      id: randomUUID(),
      tenantId,
      email: normalizedEmail,
      passwordHash: await this.hashPassword(dto.password),
    };
    this.accounts.set(key, account);

    return { id: account.id, email: account.email, tenantId: account.tenantId };
  }

  async login(tenantId: string, dto: LoginDto): Promise<{ accessToken: string }> {
    const account = this.accounts.get(this.key(tenantId, dto.email.toLowerCase()));
    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.validatePassword(dto.password, account.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { accessToken: this.generateToken(account.id, account.tenantId) };
  }
}
