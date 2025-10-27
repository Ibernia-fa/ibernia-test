import { TestBed } from '@angular/core/testing';

import { PdfReportsHttpService } from './pdf-reports-http.service';

describe('PdfReportsHttpService', () => {
  let service: PdfReportsHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfReportsHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
