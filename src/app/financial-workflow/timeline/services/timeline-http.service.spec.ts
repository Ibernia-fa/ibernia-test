import { TestBed } from '@angular/core/testing';

import { TimelineHttpService } from './timeline-http.service';

describe('TimelineHttpService', () => {
  let service: TimelineHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
