export class ApiResponse {
  count!: number;
  errorMessage!: any[];
  isSuccess!: boolean;
  pageIndex!: number;
  pageSize!: number;
  result: any;
  statusCode!: number;
  totalCount!: number;
}
