import { Global, Module } from '@nestjs/common';
import { MockSwitch } from './mock-switch';

@Global()
@Module({
  providers: [MockSwitch],
  exports: [MockSwitch],
})
export class MockingModule {}
