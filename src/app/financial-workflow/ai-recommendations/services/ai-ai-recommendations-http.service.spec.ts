import { TestBed } from '@angular/core/testing';

import { AiRecommendationsHttpService } from './ai-recommendations-http.service';

describe('AiRecommendationsHttpService', () => {
  let service: AiRecommendationsHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiRecommendationsHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
