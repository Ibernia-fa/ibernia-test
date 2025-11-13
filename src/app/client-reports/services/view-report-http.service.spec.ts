import { TestBed } from '@angular/core/testing';

import { ViewReportHttpService } from './view-report-http.service';

describe('ViewReportHttpService', () => {
  let service: ViewReportHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewReportHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
