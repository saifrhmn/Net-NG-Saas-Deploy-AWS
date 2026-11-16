export class BaseColorantRatioVM {
  depot: string;
  dealerId: string;
  dealerName: string;
  reports: BaseColorantRatioReport[];
  cyytdRatio: number;
  lyytdRatio: number;
  totalCount: number;
}

export class BaseColorantRatioReport {
  product: string;
  lyytd: number;
  cyytd: number;
  ytdGrowth: number
}
