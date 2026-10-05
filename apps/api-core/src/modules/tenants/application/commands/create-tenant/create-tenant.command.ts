import { Command } from '@nestjs/cqrs';
import { TenantView } from '../../views/tenant.view';

export class CreateTenantCommand extends Command<TenantView> {
  constructor(
    readonly slug: string,
    readonly name: string,
  ) {
    super();
  }
}
