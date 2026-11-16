export class PlanVsActualDetailsReportsVM {
  userId: string;
  userName: string;
  role: string;
  depot: string;
  territory: string;
  zone: string;
  customerNo: string;
  customerName: string;
  dayWiseStatus: { [key: number]: string };
  targetVisits: number;
  plannedVisit: number;
  adhocVisit: number;
  plannedNotVisit: number;
  totalVisit: number;
  totalCount: number;
}


export class PlanVsActualSummeryReportsVM {
  userId: string;
  userName: string;
  role: string;
  depot: string;
  territory: string;
  zone: string;
  dealerPlanned: number;
  dealerVisited: number;
  plannedCrossTerritory: number;
  visitCrossTerritory: number;
  targetVisits: number;
  plannedVisit: number;
  adhocVisit: number;
  plannedNotVisit: number;
  totalVisit: number;
  adhocContribution: number;
  totalCount: number;
}

export class PlanVsActualSummeryDaywiseReportsVM {
  userId: string;
  userName: string;
  role: string;
  depot: string;
  workingDay: number;
  daysPlanned: number;
  daysVisited: number;
  noPlannedDays: number;
  noVisitDays: number;
  totalCount: number;
}

