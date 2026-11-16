import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerStatementReportComponent } from './customer-statement-report.component';

describe('CustomerStatementReportComponent', () => {
  let component: CustomerStatementReportComponent;
  let fixture: ComponentFixture<CustomerStatementReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerStatementReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerStatementReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
