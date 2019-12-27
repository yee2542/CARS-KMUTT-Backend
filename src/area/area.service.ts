import { Injectable, Inject, HttpStatus, HttpException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Area } from './interfaces/area.interface';
import { AreaBuilding } from './interfaces/area.building.interface';
import { AreaBuildingCreateDto } from './dtos/area.building.create.dto';
import { AreaCreateDto } from './dtos/area.create.dto';
import { FormService } from 'src/form/form.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AreaService {
  constructor(
    @Inject('AREA_MODEL') private readonly areaModel: Model<Area>,
    @Inject('AREA_BUILDING_MODEL')
    private readonly areaBuildingModel: Model<AreaBuilding>,
    private readonly formService: FormService,
    private readonly userService: UsersService,
  ) { }

  async createAreaBuilding(data: AreaBuildingCreateDto): Promise<AreaBuilding> {
    try {
      const duplicated = await this.areaBuildingModel.findOne({
        label: data.label,
      });
      if (duplicated) {
        throw new HttpException('label duplicated', HttpStatus.NOT_ACCEPTABLE);
      }
      const doc = new this.areaBuildingModel(data);
      const saved = await doc.save();
      return saved;
    } catch (err) {
      throw err;
    }
  }

  async createArea(data: AreaCreateDto): Promise<Area> {
    try {
      const duplicated = await this.areaModel.findOne({ name: data.name });
      if (duplicated) {
        throw new HttpException('label duplicated', HttpStatus.NOT_ACCEPTABLE);
      }

      // linking validation
      const formId = data.form
        ? await this.formService.linkForm(data.form)
        : undefined;
      const buildingId = data.building
        ? await this.linkAreaBuilding(data.building)
        : undefined;
      const staffID = data.staffRequired ? await Promise.all(
        data.staffRequired.map(e => this.userService.linkUser(e, 'staff')),
      ) : undefined;
      const doc = new this.areaModel({
        ...data,
        form: formId,
        building: buildingId,
        staffRequired: staffID,
      });
      const saved = await doc.save();
      return saved;
    } catch (err) {
      throw err;
    }
  }

  async listAreaType(): Promise<AreaBuilding[]> {
    try {
      const doc = await this.areaBuildingModel.find({}).lean();
      return doc;
    } catch (err) {
      throw err;
    }
  }

  async listArea(): Promise<Area[]> {
    try {
      const doc = await this.areaModel
        .find({})
        .populate(['building', 'form'])
        .lean();
      return doc;
    } catch (err) {
      throw err;
    }
  }

  async linkAreaBuilding(id: string): Promise<AreaBuilding> {
    try {
      const doc = await this.areaBuildingModel.findById(id);
      if (!doc) {
        throw Error('area building by _id is not existing');
      }
      return doc;
    } catch (err) {
      throw err;
    }
  }
}
