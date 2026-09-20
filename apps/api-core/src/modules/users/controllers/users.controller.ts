import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UsersService } from '../services/users.service';

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
