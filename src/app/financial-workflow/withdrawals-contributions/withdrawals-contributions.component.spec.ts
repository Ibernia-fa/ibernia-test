import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawalsContributionsComponent } from './withdrawals-contributions.component';

describe('WithdrawalsContributionsComponent', () => {
  let component: WithdrawalsContributionsComponent;
  let fixture: ComponentFixture<WithdrawalsContributionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WithdrawalsContributionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WithdrawalsContributionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
