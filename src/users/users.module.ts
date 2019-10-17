import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { DatabaseModule } from 'src/database/database.module';
import { usersProviders } from './users.providers';

@Module({
  imports: [DatabaseModule],
  providers: [
    UsersService, ...usersProviders,
    UsersResolver,
  ],
})
export class UsersModule { }
