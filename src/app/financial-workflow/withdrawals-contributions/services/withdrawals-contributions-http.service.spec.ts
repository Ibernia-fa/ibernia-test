import { TestBed } from '@angular/core/testing';

import { WithdrawalsContributionsHttpService } from './withdrawals-contributions-http.service';

describe('IncomeExpensesHttpService', () => {
  let service: WithdrawalsContributionsHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WithdrawalsContributionsHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
