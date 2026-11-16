import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseInformationComponent } from './expense-information.component';

describe('ExpenseInformationComponent', () => {
  let component: ExpenseInformationComponent;
  let fixture: ComponentFixture<ExpenseInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseInformationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpenseInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
