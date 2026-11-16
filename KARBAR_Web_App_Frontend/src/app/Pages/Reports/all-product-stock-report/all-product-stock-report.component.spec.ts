import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AllProductStockReportComponent } from './all-product-stock-report.component';

describe('AllProductStockReportComponent', () => {
  let component: AllProductStockReportComponent;
  let fixture: ComponentFixture<AllProductStockReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllProductStockReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllProductStockReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should paginate filtered rows locally when zero-stock filter is enabled', () => {
    const reportService = jasmine.createSpyObj('ReportService', ['fetchAllProductStockReport']);
    reportService.fetchAllProductStockReport.and.returnValue(of({
      result: [{ quantity: 0 }, { quantity: 2 }, { quantity: 3 }],
      totalCount: 3,
    }));

    (component as any).report = reportService;
    component.includeZeroStock = true;
    component.searchReq.pageSize = 2;
    component.searchReq.pageIndex = 1;

    component.getAllstockReport({ pageIndex: 1, pageSize: 2 });

    expect(component.allReportData.length).toBe(2);
    expect(component.lstReport.length).toBe(2);
    expect(component.totalItems).toBe(2);
  });
});
