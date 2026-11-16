import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierPaybleReportComponent } from './supplier-payble-report.component';

describe('SupplierPaybleReportComponent', () => {
  let component: SupplierPaybleReportComponent;
  let fixture: ComponentFixture<SupplierPaybleReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierPaybleReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierPaybleReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
