import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import * as moment from 'moment';
import { UserInfo } from 'src/common/user.decorator';
import { UserSession } from 'src/users/interfaces/user.session.interface';
import { TaskQueryService } from './task.query.service';
// import { AreaService } from 'src/area/area.service';
import { TaskService } from './task.service';

@Controller('task')
export class TaskController {
  constructor(
    // private readonly areaService: AreaService,
    private readonly taskService: TaskService,
    private readonly historyService: TaskQueryService,
  ) {}

  @Get('/quickTask')
  @UseGuards(AuthGuard('staff'))
  async getQuickTask(
    @Query('id') areaId: string,
    @Query('start') start: string,
    @Query('stop') stop: string,
  ) {
    return this.taskService.getQuickTask(areaId, moment(start), moment(stop));
  }

  @Get('/last')
  @UseGuards(AuthGuard('requestor'))
  async getLastestTask(@UserInfo() user: UserSession) {
    const username = user.username;
    const data = await this.taskService.getLastestTask(username);
    return data;
  }

  @Get('/history')
  @UseGuards(AuthGuard('requestor'))
  async getHistory(@UserInfo() user: UserSession) {
    const { username } = user;
    return this.historyService.getAllHistory(username);
  }

  @Get('/requested')
  @UseGuards(AuthGuard('requestor'))
  async getRequested(@UserInfo() user: UserSession) {
    const { username } = user;
    return this.historyService.getAllRequested(username);
  }

  @Get('/wait')
  @UseGuards(AuthGuard('requestor'))
  async getWait(@UserInfo() user: UserSession) {
    const { username } = user;
    return this.historyService.getAllWait(username);
  }

  @Get('/:id')
  @UseGuards(AuthGuard('requestor'))
  async getTask(@UserInfo() user: UserSession, @Param('id') taskId: string) {
    // for checking authorized nxt patch
    // const { username } = user;
    return this.taskService.getTaskById(taskId);
  }

  // used for all task sport/meeting/common/area
  @Get('/:id/cancle')
  @UseGuards(AuthGuard('requestor'))
  async cancleTask(
    @UserInfo() user: UserSession,
    @Param('id') taskId: string,
    @Res() res: Response,
  ) {
    try {
      const { username } = user;
      await this.taskService.cancleTaskById(taskId, username, false, '');
      return res.sendStatus(200);
    } catch (err) {
      return err;
    }
  }
}
