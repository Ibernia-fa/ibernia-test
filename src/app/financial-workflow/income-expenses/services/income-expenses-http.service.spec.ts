import { TestBed } from '@angular/core/testing';

import { IncomeExpensesHttpService } from './income-expenses-http.service';

describe('IncomeExpensesHttpService', () => {
  let service: IncomeExpensesHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IncomeExpensesHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
