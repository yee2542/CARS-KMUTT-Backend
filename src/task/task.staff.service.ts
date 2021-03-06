import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import {
  StaffPermissionType,
  STAFF_PERMISSION,
} from 'src/users/schemas/staffs.schema';
import { TaskSearch } from './dtos/task.search.dto';
import staffGroupLvHelper from './helpers/staff.group.lv.helper';
import { TaskDoc, TaskStateType } from './interfaces/task.interface';
import { TaskManage } from './interfaces/task.manage.interface';
import { TaskStaffRequested } from './interfaces/task.staff.requested.interface';
import { TaskService } from './task.service';

const LIMIT = 10;

@Injectable()
export class TaskstaffService {
  constructor(
    @Inject('TASK_MODEL') private readonly taskModel: Model<TaskDoc>,
    private readonly taskService: TaskService,
  ) {}

  async staffSearch(
    query: TaskSearch,
  ): Promise<{ data: TaskManage[]; count: number }> {
    const SEARCH_LIMIT = 50;
    if (query.s.length === 0) return { data: [], count: 0 };

    const headProjectQuery: any = [
      {
        $project: {
          state: {
            $arrayElemAt: ['$state', -1],
          },
          _id: 1,
          key: '$_id',
          requestor: 1,
          requestorOwner: {
            $arrayElemAt: ['$requestor.username', -1],
          },
          area: 1,
          type: 1,
          createAt: 1,
          vid: 1,
        },
      },
    ];

    const areaJoin: any = [
      {
        $lookup: {
          from: 'areas',
          localField: 'area',
          foreignField: '_id',
          as: 'area',
        },
      },
      { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
    ];

    const queryLimit: any = [
      {
        $limit: SEARCH_LIMIT,
      },
    ];

    const tailProjectQuery: any = [
      {
        $project: {
          _id: 1,
          vid: 1,
          key: '$_id',
          requestor: 1,
          'area.label': 1,
          'area.name': 1,
          type: 1,
          createAt: 1,
          state: ['$state'],
        },
      },
    ];

    const typeMap =
      (query.type &&
        query.type.map(e => ({
          state: e,
        }))) ||
      [];

    const stateTypeQuery: any =
      (query.type && [
        {
          $match: {
            $or: [...typeMap],
          },
        },
      ]) ||
      [];

    const queryDateOnly = query.s.match(/\d{2}-\d{2}-\d{4}/);
    if (queryDateOnly) {
      const queryByCreateDate = await this.taskModel.aggregate([
        ...headProjectQuery,
        ...stateTypeQuery,
        {
          $match: {
            createAt: {
              $gte: new Date(
                moment(query.s, 'DD/MM/YYYY')
                  .startOf('day')
                  .toISOString(),
              ),
              $lt: new Date(
                moment(query.s, 'DD/MM/YYYY')
                  .startOf('day')
                  .add(2, 'day')
                  .toISOString(),
              ),
            },
          },
        },
        ...queryLimit,
        ...areaJoin,
        ...tailProjectQuery,
      ]);
      return { data: queryByCreateDate, count: queryByCreateDate.length };
    }

    const [queryByVId, queryByRequestor, queryByAreaname] = await Promise.all([
      // vid
      this.taskModel.aggregate([
        ...headProjectQuery,
        ...stateTypeQuery,
        {
          $match: {
            vid: {
              $regex: new RegExp(`^${query.s.toLocaleUpperCase()}`),
            },
          },
        },
        ...queryLimit,
        ...areaJoin,
        ...tailProjectQuery,
      ]),

      // requestor name
      this.taskModel.aggregate([
        ...headProjectQuery,
        ...stateTypeQuery,
        {
          $match: {
            requestorOwner: {
              $regex: `${query.s.toLocaleLowerCase()}`,
              $options: 'i',
            },
          },
        },
        ...queryLimit,
        ...areaJoin,
        ...tailProjectQuery,
      ]),

      // area name
      this.taskModel.aggregate([
        ...headProjectQuery,
        ...stateTypeQuery,
        ...areaJoin,
        {
          $match: {
            'area.label': {
              $regex: `${query.s.toLocaleLowerCase()}`,
              $options: 'i',
            },
          },
        },
        ...queryLimit,
        ...tailProjectQuery,
      ]),
    ]);

    // distinct id
    const result = [...queryByVId, ...queryByRequestor, ...queryByAreaname];
    const distinct = Array.from(new Set(result.map(a => a._id))).map(id => {
      return result.find(a => a._id === id);
    });

    return { data: distinct, count: distinct.length };
  }

  async getAllTask(
    offset?: number,
    limit?: number,
    orderCol?: string,
    order?: number,

    // tslint:disable-next-line: ban-types
    query: Object = {},
  ): Promise<{ data: TaskManage[]; count: number }> {
    const orderColField: string = orderCol || 'createAt';
    const docs: TaskManage[] = await this.taskModel.aggregate([
      {
        $project: {
          state: {
            $arrayElemAt: ['$state', -1],
          },
          staff: {
            $arrayElemAt: ['$staff', -1],
          },
          _id: 1,
          key: '$_id',
          requestor: 1,
          area: 1,
          type: 1,
          createAt: 1,
          vid: 1,
        },
      },
      { $addFields: { staffGroupType: '$staff.group' } },
      {
        $match: {
          ...query,
        },
      },
      { $sort: { [orderColField]: order || -1 } },
      { $skip: offset || 0 },
      { $limit: limit || LIMIT },
      {
        $lookup: {
          from: 'areas',
          localField: 'area',
          foreignField: '_id',
          as: 'area',
        },
      },

      { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          vid: 1,
          key: '$_id',
          requestor: 1,
          'area.label': 1,
          'area.name': 1,
          type: 1,
          createAt: 1,
          state: ['$state'],
          staff: 1,
        },
      },
    ]);
    const count = await this.taskModel.find({ ...query }).countDocuments();
    return { data: docs, count };
  }

  async getWaitTask(
    offset?: number,
    limit?: number,
    orderCol?: string,
    order?: number,
  ) {
    return await this.getAllTask(offset, limit, orderCol, order, {
      state: {
        $in: [
          TaskStateType.WAIT,
          TaskStateType.REQUESTED,
          TaskStateType.FORWARD,
          TaskStateType.RESEND,
        ],
      },
    });
  }

  async getAcceptTask(
    offset?: number,
    limit?: number,
    orderCol?: string,
    order?: number,
  ) {
    return await this.getAllTask(offset, limit, orderCol, order, {
      state: {
        $in: ['accept'],
      },
    });
  }

  async getRejectTask(
    offset?: number,
    limit?: number,
    orderCol?: string,
    order?: number,
  ) {
    return await this.getAllTask(offset, limit, orderCol, order, {
      state: {
        $in: [TaskStateType.REJECT, TaskStateType.RESEND],
      },
    });
  }

  async getDropTask(
    offset?: number,
    limit?: number,
    orderCol?: string,
    order?: number,
  ) {
    return await this.getAllTask(offset, limit, orderCol, order, {
      state: {
        $in: [TaskStateType.DROP],
      },
    });
  }

  async getForwardTask({
    offset,
    limit,
    orderCol,
    order,
    staffLevel,
  }: {
    offset?: number;
    limit?: number;
    orderCol?: string;
    order?: number;
    staffLevel: StaffPermissionType;
  }) {
    return await this.getAllTask(offset, limit, orderCol, order, {
      state: {
        $in: [TaskStateType.FORWARD],
      },
      staffGroupType: staffLevel,
    });
  }

  async rejectTask(id: string, desc?: string): Promise<void> {
    const s = await mongoose.startSession();
    try {
      s.startTransaction();
      const task = await this.taskModel
        .findById(id)
        .session(s)
        .select(['_id', 'desc', 'state']);
      if (!task) throw new Error('task is not exist');

      task.state = [...task.state, TaskStateType.REJECT];
      task.desc = this.taskService.AddDesc(task, desc);

      await task.save({ session: s });
      await s.commitTransaction();
      s.endSession();
    } catch (err) {
      await s.abortTransaction();
      throw err;
    }
  }

  async forwardTask(id: string, desc?: string): Promise<void> {
    const s = await mongoose.startSession();
    try {
      s.startTransaction();
      const task = await this.taskModel
        .findById(id)
        .session(s)
        .select(['_id', 'staff', 'desc', 'state']);
      const START_STAFF_LV_IND = 1;
      const STAFF_LEVEL = STAFF_PERMISSION;
      const alreadyPermit = task.staff && task.staff.length > 0;
      let staff: TaskStaffRequested[] = [];
      if (alreadyPermit) {
        const nextLevelStaff: number =
          staffGroupLvHelper(task.staff.slice(-1)[0]) + 1;
        const staffNext = STAFF_LEVEL[nextLevelStaff];
        const staffNextSave = [...task.staff];
        if (staffNext) {
          staffNextSave.push({
            group: STAFF_LEVEL[nextLevelStaff],
            approve: false,
          });
          staff = staffNextSave;
        } else {
          staff = task.staff;
        }
      } else {
        staff = [{ group: STAFF_LEVEL[START_STAFF_LV_IND], approve: false }];
      }

      task.staff = staff;
      task.state = [...task.state, TaskStateType.FORWARD];
      if (desc) {
        task.desc = this.taskService.AddDesc(task, desc);
      }
      await task.save({ session: s });
      await s.commitTransaction();
      s.endSession();
      return;
    } catch (err) {
      await s.abortTransaction();
      throw err;
    }
  }
}
