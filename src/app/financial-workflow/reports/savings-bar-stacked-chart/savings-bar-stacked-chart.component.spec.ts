import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavingsBarStackedChartComponent } from './savings-bar-stacked-chart.component';

describe('SavingsBarStackedChartComponent', () => {
  let component: SavingsBarStackedChartComponent;
  let fixture: ComponentFixture<SavingsBarStackedChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavingsBarStackedChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavingsBarStackedChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
