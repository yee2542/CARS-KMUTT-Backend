import {
  Controller,
  Get,
  UseGuards,
  Param,
  Res,
  BadRequestException,
  Body,
  Post,
  Query,
} from '@nestjs/common';
import { AreaService } from 'src/area/area.service';
import { TaskService } from './task.service';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/user.decorator';
import { UserSession } from 'src/users/interfaces/user.session.interface';
import { HistoryService } from './history.service';
import { Response } from 'express';
import { TaskCancelByStaff } from './dtos/task.cancel.byStaff.dto';
import * as moment from 'moment';

@Controller('task')
export class TaskController {
  constructor(
    private readonly areaService: AreaService,
    private readonly taskService: TaskService,
    private readonly historyService: HistoryService,
  ) {}

  @UseGuards(AuthGuard('staff'))
  @Get('/quickTask')
  async getQuickTask(
    @Query('id') areaId: string,
    @Query('start') start: string,
    @Query('stop') stop: string,
  ) {
    return this.taskService.getQuickTask(areaId, moment(start), moment(stop));
  }

  @UseGuards(AuthGuard('requestor'))
  @Get('/last')
  async getLastestTask(@UserInfo() user: UserSession) {
    const username = user.username;
    const data = await this.taskService.getLastestTask(username);
    return data;
  }

  @UseGuards(AuthGuard('requestor'))
  @Get('/history')
  async getHistory(@UserInfo() user: UserSession) {
    const { username } = user;
    return this.historyService.getAllHistory(username);
  }

  @UseGuards(AuthGuard('requestor'))
  @Get('/requested')
  async getRequested(@UserInfo() user: UserSession) {
    const { username } = user;
    return this.historyService.getAllRequested(username);
  }

  @UseGuards(AuthGuard('requestor'))
  @Get('/wait')
  async getWait(@UserInfo() user: UserSession) {
    const { username } = user;
    return this.historyService.getAllWait(username);
  }

  @UseGuards(AuthGuard('requestor'))
  @Get('/:id')
  async getTask(@UserInfo() user: UserSession, @Param('id') taskId: string) {
    // for checking authorized nxt patch
    const { username } = user;
    return this.taskService.getTaskById(taskId);
  }

  @UseGuards(AuthGuard('requestor'))
  @Get('/:id/cancle')
  async cancleTask(
    @UserInfo() user: UserSession,
    @Param('id') taskId: string,
    @Res() res: Response,
  ) {
    try {
      console.log('cancle task', taskId);
      const { username } = user;
      await this.taskService.cancleTaskById(taskId, username);
      return res.sendStatus(200);
    } catch (err) {
      return err;
    }
  }

  @UseGuards(AuthGuard('staff'))
  @Post('/cancle/byStaff')
  async cancleTaskByStaff(
    @UserInfo() user: UserSession,
    @Body() data: TaskCancelByStaff,
    @Res() res: Response,
  ) {
    try {
      const { username } = user;
      const { _id: taskId, desc } = data;
      await this.taskService.cancleTaskById(taskId, username, true, desc);
      return res.sendStatus(200);
    } catch (err) {
      return err;
    }
  }

  @UseGuards(AuthGuard('requestor'))
  @Get('/:id/confirm')
  async confirmTask(
    @UserInfo() user: UserSession,
    @Param('id') taskId: string,
    @Res() res: Response,
  ) {
    try {
      console.log('confirm task', taskId);
      const { username } = user;
      await this.taskService.confirmTaskById(taskId, username);
      return res.sendStatus(200);
    } catch (err) {
      return new BadRequestException(err);
    }
  }
}
