import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskResolver } from './task.resolver';
import { DatabaseModule } from '../database/database.module';
import { taskProviders } from './task.providers';
import { AreaModule } from 'src/area/area.module';
import { FormModule } from 'src/form/form.module';
import { JSONScalar } from 'src/common/json.scalar';

@Module({
  imports: [DatabaseModule, AreaModule, FormModule],
  providers: [JSONScalar, TaskService, ...taskProviders, TaskResolver],
})
export class TaskModule {}
