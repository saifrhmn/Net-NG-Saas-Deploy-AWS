import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerReceivableReportComponent } from './customer-receivable-report.component';

describe('CustomerReceivableReportComponent', () => {
  let component: CustomerReceivableReportComponent;
  let fixture: ComponentFixture<CustomerReceivableReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerReceivableReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerReceivableReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
