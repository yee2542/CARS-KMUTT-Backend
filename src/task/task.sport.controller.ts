import {
  Controller,
  UseGuards,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';

import { AreaService } from 'src/area/area.service';
import { TaskService } from './task.service';
import { HistoryService } from './history.service';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { CreateTaskSportDto } from './dtos/task.create.sport';
import { UserInfo } from 'src/common/user.decorator';
import { UserSession } from 'src/users/interfaces/user.session.interface';

@Controller('task/sport')
export class TaskSportController {
  constructor(
    private readonly areaService: AreaService,
    private readonly taskService: TaskService,
    private readonly historyService: HistoryService,
  ) {}

  @UseGuards(AuthGuard('requestor'))
  @Post('/')
  async createSportTask(
    @Body() body: CreateTaskSportDto,
    @Req() req: Request & { user: { _id: string; username: string } },
    @Res() res: Response,
    @UserInfo() user: UserSession,
  ) {
    try {
      if (body.requestor[0] !== user.studentId)
        throw new Error('user owner request invalid');
      await this.taskService.createSportTask(body);

      return res.sendStatus(200);
    } catch (err) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        msg: String(err),
      });
    }
  }
}