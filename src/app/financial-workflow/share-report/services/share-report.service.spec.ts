import { TestBed } from '@angular/core/testing';

import { ShareReportHttpService } from './share-report.service';

describe('ShareReportHttpService', () => {
  let service: ShareReportHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareReportHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
