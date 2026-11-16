import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopItemSoldComponent } from './top-item-sold.component';

describe('TopItemSoldComponent', () => {
  let component: TopItemSoldComponent;
  let fixture: ComponentFixture<TopItemSoldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopItemSoldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopItemSoldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
