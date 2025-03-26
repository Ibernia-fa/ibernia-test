import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWithdrawalComponent } from './add-withdrawal.component';

describe('AddWithdrawalComponent', () => {
  let component: AddWithdrawalComponent;
  let fixture: ComponentFixture<AddWithdrawalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWithdrawalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddWithdrawalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
