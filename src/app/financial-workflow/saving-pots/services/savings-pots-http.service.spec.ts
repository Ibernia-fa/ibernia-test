import { TestBed } from '@angular/core/testing';

import { SavingsPotsHttpService } from './savings-pots-http.service';

describe('SavingsPotsHttpService', () => {
  let service: SavingsPotsHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SavingsPotsHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
