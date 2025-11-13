import { TestBed } from '@angular/core/testing';

import { ShareReportService } from './share-report.service';

describe('ShareReportService', () => {
  let service: ShareReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
