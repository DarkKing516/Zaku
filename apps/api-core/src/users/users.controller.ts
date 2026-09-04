import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CreateUserDto } from './create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<{ id: string; email: string; tenantId: string }> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<{ id: string; email: string; tenantId: string }> {
    return this.usersService.findById(id);
  }
}
