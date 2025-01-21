import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialWorkflowDashboardComponent } from './financial-workflow-dashboard.component';

describe('FinancialWorkflowDashboardComponent', () => {
  let component: FinancialWorkflowDashboardComponent;
  let fixture: ComponentFixture<FinancialWorkflowDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialWorkflowDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialWorkflowDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
