import { TestBed } from '@angular/core/testing';

import { CashflowHttpService } from './cashflow-http.service';

describe('CashflowHttpService', () => {
  let service: CashflowHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CashflowHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
