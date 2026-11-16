import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierStatementReportComponent } from './supplier-statement-report.component';

describe('SupplierStatementReportComponent', () => {
  let component: SupplierStatementReportComponent;
  let fixture: ComponentFixture<SupplierStatementReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierStatementReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierStatementReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
