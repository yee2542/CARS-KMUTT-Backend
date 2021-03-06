import { Types } from 'mongoose';
import { AreaBuildingType } from './building.type';

export interface AreaTableAPI {
  _id: Types.ObjectId;
  key: string;
  name: string;
  label: string;
  building: {
    name: string;
    label: string;
  };
  type: AreaBuildingType;
}
