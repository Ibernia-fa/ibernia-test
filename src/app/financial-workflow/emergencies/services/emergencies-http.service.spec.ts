import { TestBed } from '@angular/core/testing';

import { EmergenciesHttpService } from './emergencies-http.service';

describe('SavingsPotsHttpService', () => {
  let service: EmergenciesHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmergenciesHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
