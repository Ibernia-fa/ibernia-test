import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSavingsBarStackedChartComponent } from './view-savings-bar-stacked-chart.component';

describe('ViewSavingsBarStackedChartComponent', () => {
  let component: ViewSavingsBarStackedChartComponent;
  let fixture: ComponentFixture<ViewSavingsBarStackedChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewSavingsBarStackedChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSavingsBarStackedChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
