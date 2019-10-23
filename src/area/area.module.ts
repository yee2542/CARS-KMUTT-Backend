import { Module } from '@nestjs/common';
import { AreaService } from './area.service';
import { AreaResolver } from './area.resolver';
import { DatabaseModule } from '../database/database.module';
import { areaProviders } from './area.providers';

@Module({
  imports: [DatabaseModule],
  providers: [
    AreaService, AreaResolver,
    ...areaProviders,
  ],
})
export class AreaModule { }
