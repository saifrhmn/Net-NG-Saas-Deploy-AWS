export class PurposewiseCallStatusReportVM {
  userID: string;
  depot: string;
  territory: string;
  zone: string;
  userName: string;
  creatorRole: string;
  totalCall: number;
  uniqueDealer: number;
  purposes: { [purposeName: string]: number }; // dynamic keys
  totalCount: number;
}
