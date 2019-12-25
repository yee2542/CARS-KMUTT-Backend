import { Module } from '@nestjs/common';
import { FormResolver } from './form.resolver';
import { FormService } from './form.service';

@Module({
  providers: [FormResolver, FormService]
})
export class FormModule {}
