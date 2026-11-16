export class BaseModel {
  id: number;
  createdTime: Date;
  createdBy: string;
  updatedTime: Date;
  updatedBy: string;
  // status: number;
  status: number = 1;
}
