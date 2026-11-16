import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlowMovingReportComponent } from './slow-moving-report.component';

describe('SlowMovingReportComponent', () => {
  let component: SlowMovingReportComponent;
  let fixture: ComponentFixture<SlowMovingReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlowMovingReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlowMovingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
