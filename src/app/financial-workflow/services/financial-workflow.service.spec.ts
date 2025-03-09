import { TestBed } from '@angular/core/testing';

import { FinancialWorkflowService } from './financial-workflow.service';

describe('FinancialWorkflowService', () => {
  let service: FinancialWorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinancialWorkflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
