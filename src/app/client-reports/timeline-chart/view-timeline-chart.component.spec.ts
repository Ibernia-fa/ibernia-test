import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewTimelineChartComponent } from './view-timeline-chart.component';

describe('ViewTimelineChartComponent', () => {
  let component: ViewTimelineChartComponent;
  let fixture: ComponentFixture<ViewTimelineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewTimelineChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewTimelineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
