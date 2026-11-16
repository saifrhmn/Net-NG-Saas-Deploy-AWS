import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeableSelectionDropdownComponent } from './typeable-selection-dropdown.component';

describe('TypeableSelectionDropdownComponent', () => {
  let component: TypeableSelectionDropdownComponent;
  let fixture: ComponentFixture<TypeableSelectionDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeableSelectionDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeableSelectionDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
