import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { tenantContext } from '../tenant/tenant-context';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './create-user.dto';

interface UserRecord {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  private readonly users = new Map<string, UserRecord>();

  constructor(private readonly authService: AuthService) {}

  async create(dto: CreateUserDto): Promise<{ id: string; email: string; tenantId: string }> {
    const tenantId = tenantContext.getTenantId();
    const normalizedEmail = dto.email.toLowerCase();
    const id = randomUUID();
    this.users.set(id, {
      id,
      tenantId,
      email: normalizedEmail,
      passwordHash: await this.authService.hashPassword(dto.password),
    });

    return { id, email: normalizedEmail, tenantId };
  }

  async findById(id: string): Promise<{ id: string; email: string; tenantId: string }> {
    const tenantId = tenantContext.getTenantId();
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('Forbidden');
    }

    return { id: user.id, email: user.email, tenantId: user.tenantId };
  }
}
