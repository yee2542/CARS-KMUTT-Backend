import { AreaBuildingType } from 'src/area/interfaces/building.type';

class AreaBuildingAPI {
  // tslint:disable-next-line: variable-name
  _id: string;
  type: AreaBuildingType;
}

// tslint:disable-next-line: max-classes-per-file
export class TaskFormCreateDto {
  // @IsNotEmpty()
  // @ValidateNested({ each: true })
  area: AreaBuildingAPI;

  // @IsNotEmpty()
  // @IsArray()
  forms: any[];
}
