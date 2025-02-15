import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavingPotsComponent } from './saving-pots.component';

describe('SavingPotsComponent', () => {
  let component: SavingPotsComponent;
  let fixture: ComponentFixture<SavingPotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavingPotsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavingPotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
