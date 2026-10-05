import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { UserAuthModule } from '@modules/user-auth/user-auth.module';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [CoreModule, TenantsModule, UsersModule, UserAuthModule],
})
export class AppModule {}
